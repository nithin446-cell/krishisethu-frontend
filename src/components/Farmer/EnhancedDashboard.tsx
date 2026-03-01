import React, { useState, useEffect } from 'react';
import { Package, IndianRupee as Rupee, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const FarmerDashboard = ({ farmerId }: { farmerId: string }) => {
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch live listings & bids directly from Supabase
  const fetchListings = async () => {
    try {
      // We use a join query to get listings AND their related bids in one go
      const { data, error } = await supabase
        .from('crop_listings')
        .select(`
          *
        `)
        .eq('farmer_id', farmerId)
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
    if (farmerId) fetchListings();
  }, [farmerId]);

  // 2. Handle Accepting a Bid via PostgreSQL RPC
  const handleAcceptBid = async (bidId: string, listingId: string) => {
    if (!window.confirm("Accept this bid? This will finalize the deal and reject other offers.")) return;

    setActionLoading(bidId);
    try {
      // Call the database function 'accept_bid'
      const { error } = await supabase.rpc('accept_bid', {
        target_bid_id: bidId,
        target_listing_id: listingId
      });

      if (error) throw error;

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

                {/* Bids Section - TEMPORARILY DISABLED AS BIDS ARE NOT LINKED PROPERLY */}
                <div className="mt-4 border-t pt-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    प्राप्त बोलियां / Received Bids
                  </h5>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 italic">Bidding system is currently down for maintenance.</p>
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