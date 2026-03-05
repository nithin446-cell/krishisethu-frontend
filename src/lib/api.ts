const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Fetch active market listings (Trader Feed)
  getMarket: async () => {
    const res = await fetch(`${API_BASE_URL}/market`);
    if (!res.ok) throw new Error('Failed to fetch market data');
    return res.json();
  },
  // Place a new bid (Trader Action)
  placeBid: async (listing_id: string, trader_id: string, amount: number, quantity: number, message?: string) => {
    const res = await fetch(`${API_BASE_URL}/trader/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id, trader_id, amount, quantity, message }),
    });
    if (!res.ok) throw new Error('Failed to place bid');
    return res.json();
  },

  // Fetch bids placed by a specific trader
  getTraderBids: async (traderId: string) => {
    const res = await fetch(`${API_BASE_URL}/trader/bids?traderId=${traderId}`);
    if (!res.ok) throw new Error('Failed to fetch trader bids');
    return res.json();
  },

  // Fetch bids received by a specific farmer
  getFarmerBids: async (farmerId: string) => {
    const res = await fetch(`${API_BASE_URL}/farmer/bids?farmerId=${farmerId}`);
    if (!res.ok) throw new Error('Failed to fetch farmer bids');
    return res.json();
  },

  // Accept a bid (Farmer Action)
  acceptBid: async (bidId: string, listing_id: string) => {
    const res = await fetch(`${API_BASE_URL}/farmer/bid/${bidId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id }),
    });
    if (!res.ok) throw new Error('Failed to accept bid');
    return res.json();
  },

  // NEW: List new crop/produce (Farmer Action)
  listProduce: async (produceData: any, isFormData: boolean = false) => {
    const headers: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };
    const body = isFormData ? produceData : JSON.stringify(produceData);

    const res = await fetch(`${API_BASE_URL}/farmer/upload`, {
      method: 'POST',
      headers,
      body,
    });

    // NEW: Capture the actual error from the backend
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to list produce');
    }
    return res.json();
  },

  // Admin APIs
  getAdminOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/orders`);
    if (!res.ok) throw new Error('Failed to fetch admin orders');
    return res.json();
  },

  getAdminBids: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/bids`);
    if (!res.ok) throw new Error('Failed to fetch admin bids');
    return res.json();
  }
};