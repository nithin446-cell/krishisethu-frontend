// 🚀 Hardcoded to bypass Vite .env proxy issues during local development
const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get authentication headers
const getAuthHeaders = (isFormData: boolean = false) => {
  const token = localStorage.getItem('supabase_token');
  const headers: HeadersInit = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  return headers;
};

// 🛡️ A secure wrapper that catches HTML errors and gives readable feedback
const fetchJSON = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    
    // Check if the server returned HTML (like a Vite 404 proxy page) instead of JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error(`HTML Error from ${url}. Check if your backend is running and the URL is correct.`);
      throw new Error(`Connection Error: The server returned a webpage instead of data. Make sure backend is on port 5000.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    
    // Check if backend wrapped it in { success: true, data: [...] } and return just the array
    return data.data !== undefined ? data.data : data;
    
  } catch (error: any) {
    console.error(`API Call failed for ${url}:`, error.message);
    throw error;
  }
};

export const api = {
  // Fetch active market listings (Trader Feed)
  getMarket: async () => fetchJSON(`${API_BASE_URL}/market`, { headers: getAuthHeaders() }),
  
  // Fetch active farmer listings (Farmer Feed)
  getFarmerListings: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/listings?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  
  // Place a new bid (Trader Action)
  placeBid: async (listing_id: string, trader_id: string, amount: number, quantity: number, message?: string) => 
    fetchJSON(`${API_BASE_URL}/trader/bid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ listing_id, trader_id, amount, quantity, message }),
    }),
    
  // Fetch bids placed by a specific trader
  getTraderBids: async (traderId: string) => fetchJSON(`${API_BASE_URL}/trader/bids?trader_id=${traderId}`, { headers: getAuthHeaders() }),
  
  // Fetch bids received by a specific farmer
  getFarmerBids: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/bids?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  
  // Fetch accepted orders for a farmer
  getFarmerOrders: async (farmerId: string) => fetchJSON(`${API_BASE_URL}/farmer/orders?farmer_id=${farmerId}`, { headers: getAuthHeaders() }),
  
  // Accept a bid (Farmer Action)
  acceptBid: async (bidId: string, listing_id: string) => 
    fetchJSON(`${API_BASE_URL}/farmer/bid/${bidId}/accept`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ listing_id }),
    }),
    
  // List new crop/produce (Farmer Action)
  listProduce: async (produceData: any, isFormData: boolean = false) => {
    const headers = getAuthHeaders(isFormData);
    const body = isFormData ? produceData : JSON.stringify(produceData);
    return fetchJSON(`${API_BASE_URL}/farmer/upload`, { method: 'POST', headers, body });
  },
  
  // Admin APIs
  getAdminOrders: async () => fetchJSON(`${API_BASE_URL}/admin/orders`, { headers: getAuthHeaders() }),
  
  getAdminBids: async () => fetchJSON(`${API_BASE_URL}/admin/bids`, { headers: getAuthHeaders() })
};