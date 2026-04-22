import React, { useState, useEffect } from 'react';
import { Package, Bell, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import { Produce } from '../../types';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import EnhancedChatInterface from '../Chat/EnhancedChatInterface';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../lib/contexts/AuthContext';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface TraderDashboardProps {
  availableProduce: Produce[]; 
  traderId: string;
  onViewOrderTracking?: (id: string) => void;
  onRegisterRefresh?: (fn: () => Promise<void>) => void;
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ availableProduce, traderId, onViewOrderTracking, onRegisterRefresh }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [liveProduce, setLiveProduce] = useState<any[]>([]); 
  const [liveBids, setLiveBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<string>(user?.verified ? 'verified' : 'unverified');
  const [activeChat, setActiveChat] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);

  const fetchDashboardData = async () => {
    try {
      if (liveTransactions.length === 0 && liveBids.length === 0) setLoading(true);
      // Fetch data + verification status in parallel — don't let a failed
      // users query silently block the order/bids fetch (backend auth handles security)
      const [txData, bidsData, marketData, userResult] = await Promise.all([
        api.getTraderOrders(traderId).catch(() => []),
        api.getTraderBids(traderId).catch(() => []),
        api.getMarket().catch(() => []),
        supabase.from('users').select('verification_status').eq('id', traderId).maybeSingle()
      ]);

      if (userResult?.error) {
        console.error('[TRADER_VERIFY]', userResult.error.message);
      }

      // If userResult.data is null, we stick with the existing status (likely from useAuth)
      if (userResult?.data?.verification_status) {
        setVerificationStatus(userResult.data.verification_status);
      } else if (user?.verified) {
        setVerificationStatus('verified');
      }

      console.log('[TRADER_DASHBOARD] orders:', txData?.length, 'bids:', bidsData?.length);
      setLiveTransactions(Array.isArray(txData) ? txData : []);
      setLiveBids(Array.isArray(bidsData) ? bidsData : []);
      setLiveProduce(Array.isArray(marketData) ? marketData : []);
    } catch (err: any) {
      console.error("[TRADER_DASHBOARD] Failed to load data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (traderId) {
      fetchDashboardData();
      // Register refresh fn with parent (Header refresh button)
      if (onRegisterRefresh) onRegisterRefresh(fetchDashboardData);
      const channel = supabase.channel('trader_updates_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `trader_id=eq.${traderId}` }, () => fetchDashboardData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `trader_id=eq.${traderId}` }, () => fetchDashboardData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crop_listings' }, () => fetchDashboardData())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${traderId}` }, () => fetchDashboardData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [traderId]);

  const handlePayment = async (order: any) => {
    if (!window.confirm(t('trader.payConfirm').replace('{amount}', order.final_amount))) return;
    
    setProcessingPayment(order.id);
    try {
      const res = await loadRazorpayScript();
      if (!res) return alert(t('trader.razorpayFail') || 'Razorpay SDK failed to load.');

      const paymentIntent = await api.processPayment({
        order_id: order.id,
        amount: order.final_amount,
        listing_id: order.listing_id,
        quantity: order.bids?.[0]?.quantity || order.bids?.quantity || 1,
        agreed_price: order.final_amount
      });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: paymentIntent.amount, 
        currency: "INR",
        name: "Krishisethu Marketplace",
        description: `${t('trader.paymentTitle')} #${order.id.slice(0, 8)}`,
        order_id: paymentIntent.razorpay_order_id,
        handler: async function (response: any) {
          try {
            await api.verifyPayment(order.id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment Successful! Awaiting Farmer Confirmation.');
            await fetchDashboardData(); 
          } catch (error: any) {
            alert("Payment verification failed: " + error.message);
          }
        },
        prefill: { name: "Trader User", email: "trader@krishisethu.com", contact: "9999999999" },
        theme: { color: "#16a34a" }
      };

      const rzpWindow = new (window as any).Razorpay(options);
      rzpWindow.on('payment.failed', (response: any) => alert(`Payment failed! Reason: ${response.error.description}`));
      rzpWindow.open();
    } catch (error: any) {
      alert("Failed to initialize payment: " + error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  // 🛑 THE GATEKEEPER LOCKOUT 🛑
  if (verificationStatus !== 'verified') {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-[70vh] bg-gray-50">
        <ShieldAlert size={64} className={`${verificationStatus === 'pending_verification' ? 'text-yellow-500' : 'text-red-500'} mb-4`} />
        <h2 className="text-2xl font-bold text-gray-800">{t('trader.verifyTitle')}</h2>
        <p className="mt-2 text-gray-600 max-w-md">
          {verificationStatus === 'pending_verification' 
            ? t('trader.verifyPending') 
            : t('trader.verifyRequired')}
        </p>
        <div className="mt-8 p-4 bg-white border rounded-xl shadow-sm text-sm text-gray-500 flex flex-col items-center">
          <FileText size={24} className="mb-2 text-indigo-500" />
          <p className="font-semibold text-gray-700">{t('trader.uploadId')}</p>
        </div>
      </div>
    );
  }

  const activeBids = liveTransactions.filter(t => t.payment_status === 'processing' || t.status === 'deal_accepted').length;
  const pendingPayments = liveTransactions.filter(t => t.payment_status === 'yet_to_paid' || t.status === 'pending_payment').length;

  const filteredTransactions = liveTransactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return ['pending', 'deal_accepted'].includes(transaction.status);
    if (selectedFilter === 'payment') return ['pending_payment', 'yet_to_paid', 'processing'].includes(transaction.payment_status || transaction.status);
    if (selectedFilter === 'completed') return transaction.payment_status === 'paid';
    return true;
  });

  const getStatusColor = (status: string, payment_status: string) => {
    if (payment_status === 'paid' || status === 'paid') return 'bg-green-100 text-green-800';
    if (payment_status === 'processing') return 'bg-blue-100 text-blue-800';
    if (payment_status === 'not_paid') return 'bg-red-100 text-red-800';
    if (status === 'pending_payment' || payment_status === 'yet_to_paid') return 'bg-yellow-100 text-yellow-800';
    if (status === 'delivered') return 'bg-purple-100 text-purple-800';
    if (status === 'dispatched') return 'bg-indigo-100 text-indigo-800';
    if (status === 'confirmed') return 'bg-teal-100 text-teal-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, payment_status: string) => {
    if (payment_status === 'paid' || status === 'paid') return t('trader.paymentConfirmed');
    if (payment_status === 'processing') return t('trader.awaitingConfirmation');
    if (payment_status === 'not_paid') return t('trader.paymentDisputed');
    if (status === 'pending_payment' || payment_status === 'yet_to_paid') return t('trader.pendingPayment');
    if (status === 'delivered') return 'Delivered';
    if (status === 'dispatched') return 'Dispatched';
    if (status === 'confirmed') return 'Order Confirmed';
    return status?.replace('_', ' ') || 'Unknown';
  };

  return (
    <div className="p-4 space-y-6 pb-24 relative">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">{t('trader.welcome')}</h2>
          </div>
          <div className="relative">
            <Bell size={24} />
            {(activeBids > 0 || pendingPayments > 0) && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{activeBids + pendingPayments}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📦 Purchase Tracking Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('trader.activeOrders')}</h3>
        <div className="space-y-4">
          {liveTransactions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
              <Package className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-500">{t('trader.noOrders')}</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} onClick={() => onViewOrderTracking && onViewOrderTracking(transaction.id)} className="border-2 border-gray-100 rounded-2xl p-4 bg-white shadow-sm cursor-pointer hover:border-blue-400 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                    <h4 className="font-bold text-gray-800">Crop: {transaction.crop_listings?.variety || 'Unknown Crop'}</h4>
                      <p className="text-sm font-semibold text-green-700">{t('farmer.amount')}: ₹{Number(transaction.final_amount || transaction.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(transaction.status, transaction.payment_status)}`}>
                    {getStatusText(transaction.status, transaction.payment_status)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t('profile.farmer')}</p>
                    <p className="font-bold text-gray-700 line-clamp-1">{transaction.farmer?.full_name || transaction.farmer?.business_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t('farmer.phone')}</p>
                    <p className="font-bold text-gray-700">{transaction.farmer?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTransactionId(selectedTransactionId === transaction.id ? null : transaction.id);
                  }} className="flex-1 py-2.5 px-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                    {selectedTransactionId === transaction.id ? 'Hide Details' : 'View Details'}
                  </button>
                
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChat({
                        orderId: transaction.id,
                        otherUserId: transaction.farmer_id,
                        otherUserName: transaction.farmer?.full_name || 'Farmer'
                      });
                    }} 
                    className="flex-1 py-2.5 px-4 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>{t('trader.messageFarmer')}</span>
                  </button>
                </div>

                {selectedTransactionId === transaction.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest border-b pb-2">{t('trader.dealDetails')}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-2 rounded-xl">
                        <p className="text-gray-400 text-[10px] font-bold uppercase">Variety</p>
                        <p className="font-bold text-gray-800">{transaction.crop_listings?.variety || 'Unknown'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl">
                        <p className="text-gray-400 text-[10px] font-bold uppercase">Quantity</p>
                        <p className="font-bold text-gray-800">{transaction.bids?.[0]?.quantity || transaction.bids?.quantity || 0} Qtl</p>
                      </div>
                    </div>

                    {(transaction.status === 'pending_payment' || transaction.payment_status === 'yet_to_paid') ? (
                      <button 
                        disabled={processingPayment === transaction.id}
                        onClick={(e) => { e.stopPropagation(); handlePayment(transaction); }}
                        className="mt-4 w-full bg-indigo-600 text-white rounded-lg py-3 font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        {processingPayment === transaction.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('trader.payNow')}
                      </button>
                    ) : (
                      <div className="mt-4 flex items-center justify-center text-green-600 font-bold text-sm bg-green-50 py-3 rounded-xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                        {t('trader.paid')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🟢 Active Bids Section */}
      {liveBids.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-indigo-50/50">
            <h3 className="text-lg font-semibold text-indigo-900">{t('trader.activeBids')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {liveBids.filter(b => b.status === 'pending').map((bid) => (
              <div key={bid.id} className="p-3 border rounded-xl bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{bid.crop_listings?.variety || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">My Bid: ₹{bid.amount}/kg · {bid.quantity}Q</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-[10px] font-bold uppercase">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛒 Market Pulse */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">{t('trader.marketPulse')}</h3>
          <div className="flex items-center text-red-500 text-xs font-bold uppercase animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5" />
            Live Deals
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveProduce.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl">
              {t('trader.noProduce')}
            </div>
          ) : (
            liveProduce.slice(0, 5).map((p) => (
              <div key={p.id} className="min-w-[200px] bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Package className="text-green-600" size={24} />
                </div>
                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{p.variety || 'Product'}</h4>
                <p className="text-xs text-green-700 font-bold">₹{p.current_price}/kg</p>
                <p className="text-[10px] text-gray-400 mt-1">{p.location}</p>
                <button className="mt-2 w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm">View Deal</button>
              </div>
            ))
          )}
        </div>
      </div>

      {activeChat && (
        <EnhancedChatInterface 
          orderId={activeChat.orderId} currentUserId={traderId} 
          otherUserId={activeChat.otherUserId} otherUserName={activeChat.otherUserName} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};

export default TraderDashboard;