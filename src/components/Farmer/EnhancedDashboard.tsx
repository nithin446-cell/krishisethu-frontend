import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Loader2, IndianRupee as Rupee, AlertTriangle, ShieldAlert, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import EnhancedChatInterface from '../Chat/EnhancedChatInterface';

const EnhancedDashboard = ({ farmerId, onViewOrderTracking }: { farmerId: string, onViewOrderTracking?: (id: string) => void }) => {
  const [myListings, setMyListings] = useState<any[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  
  // Active Chat State
  const [activeChat, setActiveChat] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { data: userData } = await supabase.from('users').select('verification_status').eq('id', farmerId).single();
      setVerificationStatus(userData?.verification_status || 'unverified');

      if (userData?.verification_status === 'verified') {
        const listings = await api.getFarmerListings(farmerId);
        setMyListings(Array.isArray(listings) ? listings : (listings?.data || []));

        const orders = await api.getFarmerOrders(farmerId);
        setFarmerOrders(Array.isArray(orders) ? orders : (orders?.data || []));
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmerId) {
      fetchDashboardData();

      const channel = supabase.channel('farmer_updates_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => fetchDashboardData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `farmer_id=eq.${farmerId}` }, () => fetchDashboardData())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${farmerId}` }, () => fetchDashboardData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [farmerId]);

  const handleAcceptBid = async (bidId: string, listingId: string) => {
    if (!window.confirm("Accept this bid? This will finalize the deal and reject other offers.")) return;

    setActionLoading(bidId);
    try {
      await api.acceptBid(bidId, listingId);
      alert("Transaction secured! Order created successfully.");
      await fetchDashboardData(); 
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentConfirmation = async (orderId: string, status: 'paid' | 'not_paid') => {
    const message = status === 'paid' 
      ? "Confirm that you have securely received the payment in your bank account?" 
      : "Report this payment as NOT received? This will flag the order for dispute.";
      
    if (!window.confirm(message)) return;

    setActionLoading(orderId);
    try {
      await api.confirmFarmerPayment(orderId, status);
      alert(`Payment status successfully marked as: ${status === 'paid' ? 'PAID' : 'NOT PAID'}`);
      await fetchDashboardData(); 
    } catch (error: any) {
      alert("Error confirming payment: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

  // 🛑 THE GATEKEEPER LOCKOUT 🛑
  if (verificationStatus !== 'verified') {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-[70vh] bg-gray-50">
        <ShieldAlert size={64} className={`${verificationStatus === 'pending_verification' ? 'text-yellow-500' : 'text-red-500'} mb-4`} />
        <h2 className="text-2xl font-bold text-gray-800">Account Verification Required</h2>
        <p className="mt-2 text-gray-600 max-w-md">
          {verificationStatus === 'pending_verification' 
            ? "Your documents are currently being reviewed by an Admin. You will be able to access the marketplace once approved." 
            : "You cannot access marketplace features until your identity is verified. Please navigate to the Profile Tab below to upload your KYC documents."}
        </p>
        <div className="mt-8 p-4 bg-white border rounded-xl shadow-sm text-sm text-gray-500 flex flex-col items-center">
          <FileText size={24} className="mb-2 text-indigo-500" />
          <p className="font-semibold text-gray-700">Go to the "Profile" Tab below to upload your ID!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 relative">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">आपकी फसलें और बोलियां / Active Listings & Bids</h3>
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
                    <h4 className="font-bold text-lg text-gray-800">{listing.variety || listing.crop_name || 'Unknown Crop'}</h4>
                    <p className="text-sm text-gray-600">Base Price: ₹{listing.current_price}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">सक्रिय / Active</span>
                </div>

                <div className="mt-4 border-t pt-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">प्राप्त बोलियां / Received Bids ({listing.bids?.length || 0})</h5>
                  <div className="space-y-2">
                    {listing.bids?.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No bids received yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {listing.bids?.map((bid: any) => (
                          <div key={bid.id} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{bid.users?.full_name || 'Trader'}</p>
                              <p className="text-xs text-gray-500">₹{bid.amount} for {bid.quantity} {listing.unit}</p>
                            </div>
                            <div>
                              {bid.status === 'pending' ? (
                                <button disabled={actionLoading === bid.id} onClick={() => handleAcceptBid(bid.id, listing.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                                  {actionLoading === bid.id ? 'Accepting...' : 'Accept'}
                                </button>
                              ) : (
                                <span className={`px-2 py-1 text-xs font-bold rounded ${bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">ऑर्डर और भुगतान / Orders & Payments</h3>
        <div className="space-y-4">
          {farmerOrders.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed">
              <Rupee className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500 text-sm">अभी तक कोई पक्का ऑर्डर नहीं / No confirmed orders yet.</p>
            </div>
          ) : (
            farmerOrders.map((order) => (
              <div key={order.id} onClick={() => onViewOrderTracking && onViewOrderTracking(order.id)} className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-green-300 transition-colors">
                <div className="flex justify-between items-start mb-3 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">Crop: {order.crop_listings?.variety || 'Unknown'}</h4>
                    <p className="text-sm font-semibold text-green-700">Amount: ₹{order.final_amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : order.payment_status === 'processing' ? 'bg-blue-100 text-blue-700' : order.payment_status === 'not_paid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status === 'yet_to_paid' ? 'Yet To Pay' : order.payment_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Trader:</strong> {order.trader?.full_name || order.trader?.business_name}</p>
                  <p><strong>Phone:</strong> {order.trader?.phone || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">Order Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChat({
                        orderId: order.id,
                        otherUserId: order.trader_id,
                        otherUserName: order.trader?.full_name || order.trader?.business_name || 'Trader'
                      });
                    }} 
                    className="mt-3 flex items-center py-1.5 px-3 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                  >
                    <MessageSquare size={14} className="mr-1" /> Message Trader
                  </button>
                </div>

                {order.payment_status === 'processing' && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                    <p className="text-sm text-blue-800 font-semibold mb-2 text-center">
                      The Trader has completed the Razorpay checkout! Please confirm receipt.
                    </p>
                    <div className="flex space-x-2">
                      <button onClick={() => handlePaymentConfirmation(order.id, 'paid')} disabled={actionLoading === order.id} className="flex-1 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 flex justify-center items-center text-sm">
                        <CheckCircle size={16} className="mr-1" /> Yes, Received
                      </button>
                      <button onClick={() => handlePaymentConfirmation(order.id, 'not_paid')} disabled={actionLoading === order.id} className="flex-1 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 flex justify-center items-center text-sm">
                        <AlertTriangle size={16} className="mr-1" /> Not Received
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {activeChat && (
        <EnhancedChatInterface 
          orderId={activeChat.orderId} currentUserId={farmerId} 
          otherUserId={activeChat.otherUserId} otherUserName={activeChat.otherUserName} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};

export default EnhancedDashboard;