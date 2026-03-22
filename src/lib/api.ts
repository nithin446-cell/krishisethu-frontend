const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const getAuthHeaders = (isFormData: boolean = false) => {
  const token = localStorage.getItem('supabase_token');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

const fetchJSON = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.headers.get("content-type")?.includes("text/html")) throw new Error(`HTML Error from ${url}. Server might be off.`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    return data.data !== undefined ? data.data : data;
  } catch (error: any) {
    throw error;
  }
};

export const api = {
  // ==========================================
  // MARKET & DASHBOARD APIs
  // ==========================================
  getMarket: async () => fetchJSON(`${API_BASE_URL}/market`, { headers: getAuthHeaders() }),
  
  // 👉 NEW: Added the missing endpoint to fetch the live CSV prices
  getLiveMarketPrices: async () => fetchJSON(`${API_BASE_URL}/market-prices`, { headers: getAuthHeaders() }),
  
  getFarmerListings: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/listings?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  placeBid: async (listing_id: string, trader_id: string, amount: number, quantity: number, message?: string) =>
    fetchJSON(`${API_BASE_URL}/trader/bid`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ listing_id, trader_id, amount, quantity, message }) }),
  getTraderBids: async (traderId: string) => fetchJSON(`${API_BASE_URL}/trader/bids?trader_id=${traderId}`, { headers: getAuthHeaders() }),
  getFarmerBids: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/bids?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  getFarmerOrders: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/orders?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  getTraderOrders: async (traderId: string) => fetchJSON(`${API_BASE_URL}/trader/orders?trader_id=${traderId}`, { headers: getAuthHeaders() }),
  acceptBid: async (bidId: string, listing_id: string) => fetchJSON(`${API_BASE_URL}/farmer/bid/${bidId}/accept`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ listing_id }) }),
  listProduce: async (produceData: any, isFormData: boolean = false) => fetchJSON(`${API_BASE_URL}/farmer/upload`, { method: 'POST', headers: getAuthHeaders(isFormData), body: isFormData ? produceData : JSON.stringify(produceData) }),

  // ==========================================
  // PAYMENT APIs
  // ==========================================
  processPayment: async (order_id: string, amount: number) => fetchJSON(`${API_BASE_URL}/payment/create`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ order_id, amount }) }),
  verifyPayment: async (order_id: string, payment_details: any) => fetchJSON(`${API_BASE_URL}/payment/verify`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ order_id, ...payment_details }) }),
  confirmFarmerPayment: async (orderId: string, payment_status: 'paid' | 'not_paid') => fetchJSON(`${API_BASE_URL}/farmer/order/${orderId}/confirm-payment`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ payment_status }) }),

  // ==========================================
  // CHAT APIs
  // ==========================================
  getMessages: async (orderId: string) => fetchJSON(`${API_BASE_URL}/chat/${orderId}`, { headers: getAuthHeaders() }),
  sendMessage: async (order_id: string, receiver_id: string, content: string) => fetchJSON(`${API_BASE_URL}/chat`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ order_id, receiver_id, content }) }),

  // ==========================================
  // BANK & PAYOUT APIs
  // ==========================================
  /**
   * Step 1: Send ₹1 penny to user's account for verification.
   * Returns a reference_id to use in subsequent steps.
   */
  initiatePennyDrop: async (data: {
    account_holder_name: string;
    account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    account_type?: string;
    bank_id: string;
  }) =>
    fetchJSON(`${API_BASE_URL}/bank/initiate-penny-drop`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  /**
   * Step 3: Submit debit card last6 + expiry.
   * Backend creates Razorpay Route linked account for farmers,
   * saves final bank_account record.
   */
  registerBankWithRazorpay: async (data: {
    reference_id: string;
    card_last6: string;
    card_expiry_month: string;
    card_expiry_year: string;
  }) =>
    fetchJSON(`${API_BASE_URL}/bank/register-with-card`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  /**
   * Fetch current user's saved (masked) bank account info.
   * Returns has_account: false if none registered.
   */
  getMyBankAccount: async () =>
    fetchJSON(`${API_BASE_URL}/bank/my-account`, {
      method: 'GET',
      headers: getAuthHeaders(),
    }),

  // ==========================================
  // KYC UPLOAD API
  // ==========================================
  uploadKYC: async (formData: any) => fetchJSON(`${API_BASE_URL}/user/kyc`, { method: 'POST', headers: getAuthHeaders(true), body: formData }),
  
  // surepass KYC routes
  getKYCStatus: async () => fetchJSON(`${API_BASE_URL}/kyc/status`, { headers: getAuthHeaders() }),
  verifyPAN: async (data: any) => fetchJSON(`${API_BASE_URL}/kyc/verify-pan`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }),
  sendAadhaarOtp: async (data: { aadhaar: string }) => fetchJSON(`${API_BASE_URL}/kyc/aadhaar-send-otp`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }),
  verifyAadhaarOtp: async (data: { client_id: string, otp: string }) => fetchJSON(`${API_BASE_URL}/kyc/aadhaar-verify-otp`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }),
  submitKYC: async (formData: FormData) => fetchJSON(`${API_BASE_URL}/kyc/submit`, { method: 'POST', headers: getAuthHeaders(true), body: formData }),

  // ==========================================
  // ADMIN APIs
  // ==========================================
  getAdminDashboard: async () => fetchJSON(`${API_BASE_URL}/admin/dashboard`, { headers: getAuthHeaders() }),

  resolveDispute: async (orderId: string, action: 'refund_trader' | 'force_complete') =>
    fetchJSON(`${API_BASE_URL}/admin/order/${orderId}/resolve`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ action }) }),

  // VERIFICATION APIs
  getPendingVerifications: async () => fetchJSON(`${API_BASE_URL}/admin/verifications`, { headers: getAuthHeaders() }),

  updateVerificationStatus: async (userId: string, status: 'verified' | 'rejected') =>
    fetchJSON(`${API_BASE_URL}/admin/verify/${userId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) }),
    
// ADMIN PRICE UPLOAD API
  uploadBulkPrices: async (prices: any[]) => 
    fetchJSON(`${API_BASE_URL}/admin/prices/bulk`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ prices }) }),
    
  uploadCSVPrices: async (formData: FormData) => 
    fetchJSON(`${API_BASE_URL}/admin/prices/upload-csv`, { method: 'POST', headers: getAuthHeaders(true), body: formData }),
    
  clearAllPrices: async () => 
    fetchJSON(`${API_BASE_URL}/admin/prices`, { method: 'DELETE', headers: getAuthHeaders() }),
};