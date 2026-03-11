import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, CircleCheck as CheckCircle, Bell, Eye, Star, MapPin, IndianRupee as Rupee, AlertTriangle, CreditCard, ShoppingCart, Wallet, FileText, Phone, Loader2 } from 'lucide-react';
import { Produce } from '../../types';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import EnhancedChatInterface from '../chat/EnhancedChatInterface';

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
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ availableProduce, traderId }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [liveProduce, setLiveProduce] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Active Chat State
  const [activeChat, setActiveChat] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { data: txData, error: txError } = await supabase
        .from('orders')
        .select(`
          id,
          final_amount,
          status,
          payment_status,
          created_at,
          farmer_id,
          bids ( quantity ),
          crop_listings ( variety, location ),
          farmer:users!farmer_id (full_name)
        `)
        .eq('trader_id', traderId)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setLiveTransactions(txData || []);

      const bidsData = await api.getTraderBids(traderId);
      setMyBids(bidsData || []);

      const marketData = await api.getMarket();
      setLiveProduce(marketData || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (traderId) {
      fetchDashboardData();

      const channel = supabase.channel('trader_updates_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `trader_id=eq.${traderId}` }, () => fetchDashboardData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `trader_id=eq.${traderId}` }, () => fetchDashboardData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crop_listings' }, () => fetchDashboardData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [traderId]);

  const handlePayment = async (order: any) => {
    if (!window.confirm(`Proceed to pay ₹${order.final_amount} for this order via Razorpay?`)) return;
    
    setProcessingPayment(order.id);
    try {
      const res = await loadRazorpayScript();
      if (!res) return alert('Razorpay SDK failed to load. Are you online?');

      const paymentIntent = await api.processPayment(order.id, order.final_amount);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: paymentIntent.amount, 
        currency: "INR",
        name: "Krishisethu Marketplace",
        description: `Payment for Order #${order.id.slice(0, 8)}`,
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

  const activeBids = liveTransactions.filter(t => t.status === 'pending' || t.status === 'deal_accepted').length;
  const totalProduce = liveProduce.length;
  const pendingPayments = liveTransactions.filter(t => t.status === 'pending_payment' || t.payment_status === 'yet_to_paid').length;

  const filteredTransactions = liveTransactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return ['pending', 'deal_accepted'].includes(transaction.status);
    if (selectedFilter === 'payment') return ['pending_payment', 'yet_to_paid', 'processing'].includes(transaction.payment_status || transaction.status);
    if (selectedFilter === 'completed') return transaction.payment_status === 'paid';
    return true;
  });

  const getStatusColor = (status: string, payment_status: string) => {
    if (payment_status === 'paid') return 'bg-green-100 text-green-800';
    if (payment_status === 'processing') return 'bg-blue-100 text-blue-800';
    if (payment_status === 'not_paid') return 'bg-red-100 text-red-800';
    if (status === 'pending_payment' || payment_status === 'yet_to_paid') return 'bg-yellow-100 text-yellow-800';
    if (status === 'pending') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, payment_status: string) => {
    if (payment_status === 'paid') return 'भुगतान सफल / Payment Confirmed';
    if (payment_status === 'processing') return 'किसान की पुष्टि की प्रतीक्षा / Awaiting Farmer Confirmation';
    if (payment_status === 'not_paid') return 'विवादित / Payment Disputed';
    if (status === 'pending_payment' || payment_status === 'yet_to_paid') return 'भुगतान लंबित / Pending Payment';
    return status;
  };

  return (
    <div className="p-4 space-y-6 pb-24 relative">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">नमस्ते व्यापारी!</h2>
            <p className="text-blue-100 text-sm">Welcome Trader!</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">खरीदारी ट्रैकिंग / Purchase Tracking</h3>
        </div>
        
        <div className="p-4 space-y-4">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Package size={16} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">Deal #{transaction.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">₹{(transaction.final_amount || transaction.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(transaction.status, transaction.payment_status)}`}>
                  {getStatusText(transaction.status, transaction.payment_status)}
                </span>
              </div>

              <div className="flex space-x-2 mt-3">
                <button onClick={() => setSelectedTransactionId(selectedTransactionId === transaction.id ? null : transaction.id)} className="flex-1 py-2 px-4 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">
                  {selectedTransactionId === transaction.id ? 'Hide Details' : 'View Details'}
                </button>
                
                {/* 💬 CHAT BUTTON (Enabled for active deals) */}
                <button 
                  onClick={() => setActiveChat({
                    orderId: transaction.id,
                    otherUserId: transaction.farmer_id,
                    otherUserName: transaction.farmer?.full_name || 'Farmer'
                  })} 
                  className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                >
                  Chat with Farmer
                </button>
              </div>

              {selectedTransactionId === transaction.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm border-b pb-2">सौदा विवरण / Deal Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Crop / फसल</p>
                      <p className="font-medium text-gray-800">{transaction.crop_listings?.variety || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Quantity / मात्रा</p>
                      <p className="font-medium text-gray-800">{transaction.bids?.[0]?.quantity || 0} Quintal</p>
                    </div>
                  </div>

                  {(transaction.status === 'pending_payment' || transaction.payment_status === 'yet_to_paid') && (
                    <button onClick={() => handlePayment(transaction)} disabled={processingPayment === transaction.id} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center">
                      {processingPayment === transaction.id ? 'Processing...' : `Pay ₹${transaction.final_amount} Now`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RENDER ACTIVE CHAT COMPONENT */}
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