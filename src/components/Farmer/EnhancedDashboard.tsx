import React, { useState, useEffect } from 'react';
import { Package, IndianRupee as Rupee, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

export const FarmerDashboard = ({ farmerId }: { farmerId: string }) => {
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch live listings & bids directly from Supabase (grouped by listing with nested bids)
  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('crop_listings')
        .select(`
          *,
          bids (
            id,
            trader_id,
            amount,
            quantity,
            status,
            created_at,
            users:trader_id (full_name)
          )
        `)
        .eq('farmer_id', farmerId)
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyListings(data || []);
    } catch (error: any) {
      console.error("Error fetching listings:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmerId) {
      fetchListings();

      const channel = supabase.channel('farmer_bids_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, () => {
          fetchListings(); // Refresh when a new bid is placed
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [farmerId]);

  // 2. Handle Accepting a Bid via PostgreSQL RPC
  const handleAcceptBid = async (bidId: string, listingId: string) => {
    if (!window.confirm("Accept this bid? This will finalize the deal and reject other offers.")) return;

    setActionLoading(bidId);
    try {
      // Call the new Express API endpoint to accept the bid
      await api.acceptBid(bidId, listingId);

      alert("Transaction secured! Order created successfully.");
      await fetchListings(); // Refresh UI to reflect 'sold' status
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Loading your listings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Top Stats - Optional: Add your existing UI here */}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">आपकी फसलें और बोलियां / Your Active Listings</h3>

        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
              <Package className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-500">No active listings found.</p>
            </div>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{listing.variety || 'Unknown Crop'}</h4>
                    <p className="text-sm text-gray-600">Base Price: ₹{listing.current_price}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700`}>
                    सक्रिय / Active
                  </span>
                </div>

                {/* Bids Section */}
                <div className="mt-4 border-t pt-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    प्राप्त बोलियां / Received Bids ({listing.bids?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {listing.bids?.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No bids received yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {listing.bids?.map((bid: any) => (
                          <div key={bid.id} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                            <div>
                              <p className="font-semibold text-sm text-gray-800">
                                {bid.users?.full_name || 'Trader'}
                              </p>
                              <p className="text-xs text-gray-500">
                                ₹{bid.amount} for {bid.quantity} {listing.unit}
                              </p>
                            </div>
                            <div>
                              {bid.status === 'pending' ? (
                                <button
                                  disabled={actionLoading === bid.id}
                                  onClick={() => handleAcceptBid(bid.id, listing.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  {actionLoading === bid.id ? 'Accepting...' : 'Accept'}
                                </button>
                              ) : (
                                <span className={`px-2 py-1 text-xs font-bold rounded ${bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {bid.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;