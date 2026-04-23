import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Loader2, IndianRupee as Rupee, AlertTriangle, ShieldAlert, FileText, MessageSquare, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import EnhancedChatInterface from '../Chat/EnhancedChatInterface';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../lib/contexts/AuthContext';

const EnhancedDashboard = ({ farmerId, onViewOrderTracking, onRegisterRefresh }: { 
  farmerId: string; 
  onViewOrderTracking?: (id: string) => void;
  onRegisterRefresh?: (fn: () => Promise<void>) => void;
}) => {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>(user?.verified ? 'verified' : 'unverified');
  const { t } = useLanguage();
  
  // Action State (Modals/Toast)
  const [activeChat, setActiveChat] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'confirm' | 'alert' }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'alert'
  });

  const showAlert = (title: string, message: string) => {
    setModal({ isOpen: true, title, message, onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })), type: 'alert' });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      },
      type: 'confirm'
    });
  };

  const fetchDashboardData = async () => {
    try {
      if (myListings.length === 0 && farmerOrders.length === 0) setLoading(true);
      const [userResult, listingsRes, ordersRes] = await Promise.all([
        supabase.from('users').select('verification_status').eq('id', farmerId).maybeSingle(),
        api.getFarmerListings(farmerId).catch(() => []),
        api.getFarmerOrders(farmerId).catch(() => [])
      ]);

      if (userResult?.error) {
        console.error('[FARMER_VERIFY]', userResult.error.message);
      }

      if (userResult?.data?.verification_status) {
        setVerificationStatus(userResult.data.verification_status);
      } else if (user?.verified) {
        setVerificationStatus('verified');
      }

      // Load data if verified (either currently or via AuthContext)
      const currentVerified = (userResult?.data?.verification_status === 'verified') || (user?.verified);
      
      if (currentVerified) {
        const listings = Array.isArray(listingsRes) ? listingsRes : (listingsRes?.data || listingsRes?.listings || []);
        setMyListings(listings);

        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || ordersRes?.orders || []);
        setFarmerOrders(orders);
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
      // Register refresh function with parent (for Header refresh button)
      if (onRegisterRefresh) onRegisterRefresh(fetchDashboardData);

      // ✅ M-9 FIX: Added specific filter for this farmer's ID to improve performance
      const channel = supabase.channel(`farmer_${farmerId}_channel`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'bids',
            filter: `farmer_id=eq.${farmerId}` 
        }, () => fetchDashboardData())
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'orders', 
            filter: `farmer_id=eq.${farmerId}` 
        }, () => fetchDashboardData())
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'users', 
            filter: `id=eq.${farmerId}` 
        }, () => fetchDashboardData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [farmerId]);

  const handleAcceptBid = async (bidId: string, listingId: string) => {
    showConfirm(
      t('farmer.acceptBidTitle'),
      t('farmer.acceptBidMessage'),
      async () => {
        setActionLoading(bidId);
        try {
          await api.acceptBid(bidId, listingId);
          showAlert(t('common.success') || 'Success!', t('order.successLabel') || 'Transaction secured!');
          await fetchDashboardData(); 
        } catch (error: any) {
          showAlert(t('common.error') || 'Error', error.message);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  const handlePaymentConfirmation = async (orderId: string, status: 'paid' | 'not_paid') => {
    const title = status === 'paid' ? t('farmer.confirmPaymentTitle') : t('farmer.disputeTitle');
    const message = status === 'paid' 
      ? t('farmer.confirmPaymentMessage')
      : t('farmer.disputeMessage');
      
    showConfirm(title, message, async () => {
        setActionLoading(orderId);
        try {
          await api.confirmFarmerPayment(orderId, status);
          showAlert("Status Updated", `Payment status successfully marked as: ${status === 'paid' ? 'PAID' : 'NOT PAID'}`);
          await fetchDashboardData(); 
        } catch (error: any) {
          showAlert("Error", "Error confirming payment: " + error.message);
        } finally {
          setActionLoading(null);
        }
    });
  };

  const DashboardSkeleton = () => (
    <div className="p-4 space-y-6 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 bg-gray-200 rounded-2xl shadow-sm border border-gray-100"></div>
        <div className="h-28 bg-gray-200 rounded-2xl shadow-sm border border-gray-100"></div>
      </div>
      
      {/* Active Listings Skeleton */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded-lg mb-4"></div>
        {[1, 2].map(i => (
          <div key={i} className="h-40 bg-gray-50 rounded-xl border border-gray-100"></div>
        ))}
      </div>

      {/* Orders Skeleton */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded-lg mb-4"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-50 rounded-xl border border-gray-100"></div>
        ))}
      </div>
    </div>
  );

  if (loading) return <DashboardSkeleton />;

  // 🛑 THE GATEKEEPER LOCKOUT 🛑
  if (verificationStatus !== 'verified') {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-[70vh] bg-gray-50">
        <ShieldAlert size={64} className={`${verificationStatus === 'pending_verification' ? 'text-yellow-500' : 'text-red-500'} mb-4`} />
        <h2 className="text-2xl font-bold text-gray-800">{t('farmer.verifyTitle')}</h2>
        <p className="mt-2 text-gray-600 max-w-md">
          {verificationStatus === 'pending_verification' 
            ? t('farmer.verifyPending') 
            : t('farmer.verifyRequired')}
        </p>
        <div className="mt-8 p-4 bg-white border rounded-xl shadow-sm text-sm text-gray-500 flex flex-col items-center">
          <FileText size={24} className="mb-2 text-indigo-500" />
          <p className="font-semibold text-gray-700">{t('farmer.uploadId')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 relative">
      {/* 📊 Summary Stats (Fix for "Total Data Blank") */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('farmer.activeListings') || 'Active Listings'}</p>
          <div className="flex items-end justify-between mt-1">
            <h4 className="text-2xl font-bold text-gray-800">{myListings.filter(l => l.status === 'active').length}</h4>
            <div className="p-2 bg-green-50 rounded-lg">
              <Package size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('farmer.totalEarnings') || 'Total Earnings'}</p>
          <div className="flex items-end justify-between mt-1">
            <h4 className="text-xl font-bold text-green-700">₹{
              farmerOrders
                .filter(o => o.payment_status === 'paid' || o.status === 'paid')
                .reduce((acc, curr) => acc + (Number(curr.final_amount) || 0), 0)
                .toLocaleString()
            }</h4>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Rupee size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('farmer.activeListings')}</h3>
        <div className="space-y-4">
          {myListings.filter(l => l.status === 'active').length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
              <Package className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-500">{t('farmer.noListings')}</p>
            </div>
          ) : (
            myListings.filter(l => l.status === 'active').map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{listing.variety || listing.crop_name || 'Unknown Crop'}</h4>
                    <p className="text-sm text-gray-600">{t('farmer.basePrice')}: ₹{listing.current_price}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">{t('farmer.active')}</span>
                </div>

                <div className="mt-4 border-t pt-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('farmer.receivedBids')} ({listing.bids?.length || 0})</h5>
                  <div className="space-y-2">
                    {listing.bids?.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">{t('farmer.noBids')}</p>
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
                                  {actionLoading === bid.id ? t('farmer.accepting') : t('farmer.accept')}
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('farmer.ordersPayments')}</h3>
        <div className="space-y-4">
          {farmerOrders.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed">
              <Rupee className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500 text-sm">{t('farmer.noConfirmedOrders')}</p>
            </div>
          ) : (
            farmerOrders.map((order) => (
              <div key={order.id} onClick={() => onViewOrderTracking && onViewOrderTracking(order.id)} className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-green-300 transition-colors">
                <div className="flex justify-between items-start mb-3 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">Crop: {order.crop_listings?.variety || 'Unknown Crop'}</h4>
                    <p className="text-sm font-semibold text-green-700">Amount: ₹{Number(order.final_amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Order: <span className="font-semibold capitalize">{order.status?.replace('_', ' ') || 'confirmed'}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    (order.payment_status === 'paid' || order.status === 'paid') ? 'bg-green-100 text-green-700' :
                    order.payment_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    order.payment_status === 'not_paid' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(order.payment_status === 'paid' || order.status === 'paid') ? 'PAID' :
                     order.payment_status === 'processing' ? 'Processing' :
                     order.payment_status === 'not_paid' ? 'Disputed' : 'Pending'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>{t('farmer.trader')}:</strong> {order.trader?.full_name || order.trader?.business_name}</p>
                  <p><strong>{t('farmer.phone')}:</strong> {order.trader?.phone || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('farmer.orderDate')}: {new Date(order.created_at).toLocaleDateString()}</p>
                  
                  <div className="flex gap-2">
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
                      <MessageSquare size={14} className="mr-1" /> {t('farmer.messageTrader')}
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrderTracking && onViewOrderTracking(order.id);
                      }} 
                      className="mt-3 flex items-center py-1.5 px-3 bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-200"
                    >
                      <Camera size={14} className="mr-1" /> {t('order.viewImages') || 'View Images'}
                    </button>
                  </div>
                </div>

                {(order.payment_status === 'processing' && order.status !== 'paid') && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                    <p className="text-sm text-blue-800 font-semibold mb-2 text-center">
                      {t('farmer.paymentReceivedDesc')}
                    </p>
                    <div className="flex space-x-2">
                      <button onClick={(e) => { e.stopPropagation(); handlePaymentConfirmation(order.id, 'paid'); }} disabled={actionLoading === order.id} className="flex-1 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 flex justify-center items-center text-sm">
                        <CheckCircle size={16} className="mr-1" /> {t('farmer.yesReceived')}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handlePaymentConfirmation(order.id, 'not_paid'); }} disabled={actionLoading === order.id} className="flex-1 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 flex justify-center items-center text-sm">
                        <AlertTriangle size={16} className="mr-1" /> {t('farmer.notReceived')}
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

      {/* Modern UI Modal (Fix C-4) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-2">{modal.title}</h4>
              <p className="text-gray-600 mb-6">{modal.message}</p>
              <div className="flex space-x-3">
                {modal.type === 'confirm' && (
                  <button 
                    onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={modal.onConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  {modal.type === 'confirm' ? t('common.confirm') || 'Confirm' : t('common.ok') || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;