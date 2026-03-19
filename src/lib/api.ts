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
  // KYC UPLOAD API
  // ==========================================
  uploadKYC: async (formData: any) => fetchJSON(`${API_BASE_URL}/user/kyc`, { method: 'POST', headers: getAuthHeaders(true), body: formData }),

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