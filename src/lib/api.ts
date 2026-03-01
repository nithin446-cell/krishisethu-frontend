const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Fetch active market listings (Trader Feed)
  getMarket: async () => {
    const res = await fetch(`${API_BASE_URL}/market`);
    if (!res.ok) throw new Error('Failed to fetch market data');
    return res.json();
  },
  // Place a new bid (Trader Action)
  placeBid: async (listing_id: string, trader_id: string, amount: number) => {
    const res = await fetch(`${API_BASE_URL}/trader/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id, trader_id, amount }),
    });
    if (!res.ok) throw new Error('Failed to place bid');
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
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
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
  }
};