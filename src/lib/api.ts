import { supabase } from './supabase';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const getAuthHeaders = async (isFormData: boolean = false): Promise<HeadersInit> => {
  // Always get a fresh token from the live Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem('supabase_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // Keep localStorage in sync for other parts of the app
    if (session?.access_token) localStorage.setItem('supabase_token', session.access_token);
  }
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

/**
 * Fetch with timeout — prevents hung connections when the backend is unresponsive.
 */
const fetchWithTimeout = (url: string, options?: RequestInit, timeoutMs: number = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

/**
 * Determines whether a failed request should be retried.
 * Only retry on network failures and server-side (5xx) errors — never on client errors (4xx).
 */
const isRetryable = (error: any, status?: number): boolean => {
  // Network-level failures (backend offline, DNS failure, CORS when server is down)
  if (error.name === 'AbortError') return true;              // timeout
  if (error.name === 'TypeError') return true;                // fetch() failed entirely
  if (error.message?.includes('Failed to fetch')) return true;
  if (error.message?.includes('NetworkError')) return true;
  if (error.message?.includes('error page')) return true;     // HTML error page from proxy
  // Server-side errors
  if (status && status >= 500) return true;
  return false;
};

/**
 * Resilient fetchJSON with:
 *  - 15s request timeout
 *  - Automatic retry (up to 3 attempts) with exponential backoff for network/5xx errors
 *  - Clean error messages for non-retryable failures
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const fetchJSON = async (url: string, options?: RequestInit) => {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Wait before retry (skip delay on first attempt)
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.warn(`[fetchJSON] Retry ${attempt}/${MAX_RETRIES} for ${url} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }

      const res = await fetchWithTimeout(url, options);

      // 1. Check for HTML error pages (often returned by proxies or crashed servers)
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("text/html")) {
        const htmlError = new Error("Server returned an error page. Backend might be down or misconfigured.");
        (htmlError as any)._status = res.status;
        throw htmlError;
      }

      // 2. Handle empty success responses
      if (res.status === 204 || res.status === 304) return { success: true, data: [] };

      // 3. Parse JSON
      const data = await res.json().catch(() => null);

      // 4. Handle non-ok responses
      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `API Error (${res.status})`;
        const apiError = new Error(errorMsg);
        (apiError as any)._status = res.status;
        throw apiError;
      }

      // 5. Return data correctly: unwrap { success: true, data: [...] } pattern if present
      if (data && typeof data === 'object') {
        if (data.success === false) throw new Error(data.error || "Request failed");
        return data.data !== undefined ? data.data : data;
      }
      return data;

    } catch (error: any) {
      lastError = error;
      const status = error._status;

      // Only retry on retryable errors and if we haven't exhausted attempts
      if (attempt < MAX_RETRIES && isRetryable(error, status)) {
        continue;
      }

      // Non-retryable or exhausted retries — throw immediately
      break;
    }
  }

  // All retries exhausted
  console.error(`[fetchJSON Error] ${url} (after ${MAX_RETRIES + 1} attempts):`, lastError);
  throw lastError;
};

export const api = {
  // ==========================================
  // MARKET & DASHBOARD APIs
  // ==========================================
  getMarket: async () => fetchJSON(`${API_BASE_URL}/market`, { headers: await getAuthHeaders() }),
  
  // 👉 NEW: Added the missing endpoint to fetch the live CSV prices
  getLiveMarketPrices: async () => fetchJSON(`${API_BASE_URL}/market-prices`, { headers: await getAuthHeaders() }),
  
  getFarmerListings: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/listings?farmer_id=${farmerId}`, { headers: await getAuthHeaders() }),
  placeBid: async (listing_id: string, trader_id: string, amount: number, quantity: number, message?: string) =>
    fetchJSON(`${API_BASE_URL}/trader/bid`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ listing_id, trader_id, amount, quantity, message }) }),
  getTraderBids: async (traderId: string) => fetchJSON(`${API_BASE_URL}/trader/bids?trader_id=${traderId}`, { headers: await getAuthHeaders() }),
  getFarmerBids: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/bids?farmer_id=${farmerId}`, { headers: await getAuthHeaders() }),
  getFarmerOrders: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/orders?farmer_id=${farmerId}`, { headers: await getAuthHeaders() }),
  getTraderOrders: async (traderId: string) => fetchJSON(`${API_BASE_URL}/trader/orders?trader_id=${traderId}`, { headers: await getAuthHeaders() }),
  acceptBid: async (bidId: string, listing_id: string) => fetchJSON(`${API_BASE_URL}/farmer/bid/${bidId}/accept`, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ listing_id }) }),
  listProduce: async (produceData: any, isFormData: boolean = false) => fetchJSON(`${API_BASE_URL}/farmer/upload`, { method: 'POST', headers: await getAuthHeaders(isFormData), body: isFormData ? produceData : JSON.stringify(produceData) }),

  // ==========================================
  // ORDER TRACKING APIs
  // ==========================================
  getOrderById: async (id: string) => fetchJSON(`${API_BASE_URL}/orders/${id}`, { headers: await getAuthHeaders() }),
  updateOrderStatus: async (id: string, status: string, data?: any) => fetchJSON(`${API_BASE_URL}/orders/${id}/status`, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ status, ...data }) }),
  updateOrderStatusWithPhoto: async (id: string, formData: FormData) => fetchJSON(`${API_BASE_URL}/orders/${id}/deliver`, { method: 'PUT', headers: await getAuthHeaders(true), body: formData }),
  raiseDispute: async (id: string, data: any) => fetchJSON(`${API_BASE_URL}/orders/${id}/dispute`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  submitRating: async (id: string, data: any) => fetchJSON(`${API_BASE_URL}/orders/${id}/rating`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  getUserRating: async (userId: string) => fetchJSON(`${API_BASE_URL}/users/${userId}/rating`, { headers: await getAuthHeaders() }),

  // ==========================================
  // PAYMENT APIs
  // ==========================================
  processPayment: async (data: { order_id: string, amount: number, listing_id: string, quantity?: number, agreed_price?: number }) => fetchJSON(`${API_BASE_URL}/payment/create`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  verifyPayment: async (order_id: string, payment_details: any) => fetchJSON(`${API_BASE_URL}/payment/verify`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ order_id, ...payment_details }) }),
  confirmFarmerPayment: async (orderId: string, payment_status: 'paid' | 'not_paid') => fetchJSON(`${API_BASE_URL}/farmer/order/${orderId}/confirm-payment`, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ payment_status }) }),

  // ==========================================
  // MANDI PRICE APIs (AGMARKNET)
  // ==========================================
  getMandiPrices: async (options: { state?: string; commodity?: string } = {}) => {
    let url = `${API_BASE_URL}/mandi/prices`;
    const params = new URLSearchParams();
    if (options.state) params.append('state', options.state);
    if (options.commodity) params.append('commodity', options.commodity);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJSON(url, { headers: await getAuthHeaders() });
  },
  getTopMandiPrices: async (commodity: string, limit = 10) => 
    fetchJSON(`${API_BASE_URL}/mandi/prices/top?commodity=${encodeURIComponent(commodity)}&limit=${limit}`, { headers: await getAuthHeaders() }),
  clearMandiCache: async () =>
    fetchJSON(`${API_BASE_URL}/admin/mandi/clear-cache`, { method: 'POST', headers: await getAuthHeaders() }),

  // ==========================================
  // CHAT APIs
  // ==========================================
  getMessages: async (orderId: string) => fetchJSON(`${API_BASE_URL}/chat/${orderId}`, { headers: await getAuthHeaders() }),
  sendMessage: async (order_id: string, receiver_id: string, content: string) => fetchJSON(`${API_BASE_URL}/chat`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ order_id, receiver_id, content }) }),

  // ==========================================
  // BANK & PAYOUT APIs
  // ==========================================
  /**
   * Step 1: Send ₹1 penny to user's account for verification.
   * Returns a reference_id to use in subsequent steps.
   */
  initiatePennyDrop: async (data: {
    user_id: string;
    account_holder_name: string;
    account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    account_type?: string;
    bank_id: string;
  }) =>
    fetchJSON(`${API_BASE_URL}/bank/initiate-penny-drop`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  /**
   * Step 2: User confirms the exact rupee amount they received.
   * Backend compares against HMAC — amount is never stored as plaintext.
   */
  verifyPennyDrop: async (data: {
    reference_id: string;
    entered_amount: number;
  }) =>
    fetchJSON(`${API_BASE_URL}/bank/verify-penny-drop`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  /**
   * Step 3: Submit debit card last6 + expiry.
   * Backend creates Razorpay Route linked account for farmers,
   * saves final bank_account record.
   */
  registerBankWithRazorpay: async (data: {
    user_id: string;
    role: string;
    reference_id: string;
    card_last6: string;
    card_expiry_month: string;
    card_expiry_year: string;
  }) =>
    fetchJSON(`${API_BASE_URL}/bank/register-with-card`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  /**
   * Fetch current user's saved (masked) bank account info.
   * Returns has_account: false if none registered.
   */
  getMyBankAccount: async () =>
    fetchJSON(`${API_BASE_URL}/bank/my-account`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    }),

  // ==========================================
  // KYC UPLOAD API
  // ==========================================
  uploadKYC: async (formData: any) => fetchJSON(`${API_BASE_URL}/user/kyc`, { method: 'POST', headers: await getAuthHeaders(true), body: formData }),
  
  getKYCStatus: async () => fetchJSON(`${API_BASE_URL}/kyc/status`, { headers: await getAuthHeaders() }),
  verifyPAN: async (data: any) => fetchJSON(`${API_BASE_URL}/kyc/verify-pan`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  sendAadhaarOtp: async (data: { aadhaar: string }) => fetchJSON(`${API_BASE_URL}/kyc/aadhaar-send-otp`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  verifyAadhaarOtp: async (data: { client_id: string, otp: string }) => fetchJSON(`${API_BASE_URL}/kyc/aadhaar-verify-otp`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) }),
  submitKYC: async (formData: FormData) => fetchJSON(`${API_BASE_URL}/kyc/submit`, { method: 'POST', headers: await getAuthHeaders(true), body: formData }),

getAdminDashboard: async () =>
  fetchJSON(`${API_BASE_URL}/admin/orders`, { method: 'GET', headers: await getAuthHeaders() }),

adminGetStats: async () =>
  fetchJSON(`${API_BASE_URL}/admin/stats`, { method: 'GET', headers: await getAuthHeaders() }),

adminGetKYCList: async (status: 'pending'|'approved'|'rejected') =>
  fetchJSON(`${API_BASE_URL}/admin/kyc?status=${status}`, { method: 'GET', headers: await getAuthHeaders() }),

adminKYCDecision: async (userId: string, decision: string, reason?: string) =>
  fetchJSON(`${API_BASE_URL}/admin/kyc/${userId}/decision`, {
    method: 'POST', headers: await getAuthHeaders(),
    body: JSON.stringify({ decision, reason }),
  }),

adminGetDisputes: async (status = 'open') =>
  fetchJSON(`${API_BASE_URL}/admin/disputes?status=${status}`, { method: 'GET', headers: await getAuthHeaders() }),

adminResolveDispute: async (id: string, data: { decision: string; resolution: string }) =>
  fetchJSON(`${API_BASE_URL}/admin/disputes/${id}/resolve`, {
    method: 'POST', headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  }),

adminGetUsers: async (params: { search?: string; role?: string }) =>
  fetchJSON(`${API_BASE_URL}/admin/users?search=${params.search||''}&role=${params.role||'all'}`, {
    method: 'GET', headers: await getAuthHeaders()
  }),

adminUpdateUserStatus: async (userId: string, status: string) =>
  fetchJSON(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: 'PATCH', headers: await getAuthHeaders(),
    body: JSON.stringify({ status }),
  }),

adminGetPayouts: async (status = 'all') =>
  fetchJSON(`${API_BASE_URL}/admin/payouts?status=${status}`, { method: 'GET', headers: await getAuthHeaders() }),

adminManualPayout: async (orderId: string) =>
  fetchJSON(`${API_BASE_URL}/admin/payouts/${orderId}/pay`, {
    method: 'POST', headers: await getAuthHeaders()
  }),

  resolveDispute: async (orderId: string, action: 'refund_trader' | 'force_complete') =>
    fetchJSON(`${API_BASE_URL}/admin/order/${orderId}/resolve`, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ action }) }),

  getPendingVerifications: async () => fetchJSON(`${API_BASE_URL}/admin/verifications`, { headers: await getAuthHeaders() }),

  updateVerificationStatus: async (userId: string, status: 'verified' | 'rejected') =>
    fetchJSON(`${API_BASE_URL}/admin/verify/${userId}`, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ status }) }),
    
  uploadBulkPrices: async (prices: any[]) => 
    fetchJSON(`${API_BASE_URL}/admin/prices/bulk`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ prices }) }),
    
  uploadCSVPrices: async (formData: FormData) => 
    fetchJSON(`${API_BASE_URL}/admin/prices/upload-csv`, { method: 'POST', headers: await getAuthHeaders(true), body: formData }),
    
  clearAllPrices: async () => 
    fetchJSON(`${API_BASE_URL}/admin/prices`, { method: 'DELETE', headers: await getAuthHeaders() }),

  getGovernmentSchemes: async () => 
    fetchJSON(`${API_BASE_URL}/schemes`, { method: 'GET', headers: await getAuthHeaders() }),
    
  getTraders: async () => 
    fetchJSON(`${API_BASE_URL}/traders`, { method: 'GET', headers: await getAuthHeaders() }),

  /**
   * Lightweight health check — pings the backend root with a short timeout.
   * Returns { online: true, latencyMs } on success, { online: false } on failure.
   * Never throws; always returns a result.
   */
  healthCheck: async (): Promise<{ online: boolean; latencyMs?: number }> => {
    const start = Date.now();
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetchWithTimeout(`${baseUrl}/api/health`, {}, 5000);
      if (res.ok || res.status === 404) {
        // 404 is fine — it means the server is alive but the route doesn't exist
        return { online: true, latencyMs: Date.now() - start };
      }
      return { online: false };
    } catch {
      return { online: false };
    }
  },
};