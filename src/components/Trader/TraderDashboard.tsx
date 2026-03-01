import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, CircleCheck as CheckCircle, Bell, Eye, Star, MapPin, IndianRupee as Rupee, AlertTriangle, CreditCard, ShoppingCart, Wallet, FileText, Phone, Loader2 } from 'lucide-react';
import { Produce } from '../../types';
import { supabase } from '../../lib/supabase';

interface TraderDashboardProps {
  availableProduce: Produce[]; // You can leave this as a prop, or fetch live inside the component
  traderId: string;
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ availableProduce, traderId }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // LIVE DATA STATES
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispute UI States
  const [disputingTxId, setDisputingTxId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // FETCH LIVE ORDERS (TRANSACTIONS)
  useEffect(() => {
    const fetchMyTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            final_amount,
            status,
            created_at,
            bids ( quantity ),
            crop_listings ( variety, location )
          `)
          .eq('trader_id', traderId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLiveTransactions(data || []);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (traderId) fetchMyTransactions();
  }, [traderId]);

  // Metrics calculation using LIVE data
  const activeBids = liveTransactions.filter(t => t.status === 'pending' || t.status === 'deal_accepted').length;
  const completedDeals = liveTransactions.filter(t => t.status === 'completed').length;
  const totalProduce = availableProduce.length; // Still using passed prop for this count
  const pendingPayments = liveTransactions.filter(t => t.status === 'payment_initiated').length;
  const totalInvestment = liveTransactions
    .filter(t => t.status !== 'pending')
    .reduce((sum, t) => sum + Number(t.final_amount), 0);

  // Filter Logic
  const filteredTransactions = liveTransactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return ['pending', 'deal_accepted'].includes(transaction.status);
    if (selectedFilter === 'payment') return ['payment_initiated', 'payment_completed'].includes(transaction.status);
    if (selectedFilter === 'completed') return transaction.status === 'completed';
    return true;
  });

  // ... KEEP YOUR EXISTING submitDispute, getStatusColor, getStatusText, getStatusIcon FUNCTIONS HERE ...
  /**
   * INTEGRATED LOGIC: Order-based Dispute Submission
   * Links to the 'orders' table for production-grade tracking
   */
  const submitDispute = async (orderId: string) => {
    if (!disputeReason.trim()) return alert("Please provide a reason / कृपया कारण बताएं।");

    try {
      const { error } = await supabase
        .from('disputes')
        .insert([{
          order_id: orderId, // Linked to the finalized Order/Transaction
          trader_id: traderId,
          reason: disputeReason,
          status: 'open'
        }]);

      if (error) throw error;

      alert("Dispute raised. Admin notified via Realtime / विवाद दर्ज किया गया। एडमिन को सूचित कर दिया गया है।");
      setDisputingTxId(null);
      setDisputeReason('');
    } catch (err: any) {
      console.error("Dispute error:", err.message);
      alert("Error raising dispute: " + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'payment_completed': return 'bg-green-100 text-green-800';
      case 'payment_initiated': return 'bg-blue-100 text-blue-800';
      case 'deal_accepted': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'बोली लंबित / Bid Pending';
      case 'deal_accepted': return 'सौदा स्वीकार / Deal Accepted';
      case 'payment_initiated': return 'भुगतान प्रक्रिया / Payment Processing';
      case 'payment_completed': return 'भुगतान पूर्ण / Payment Complete';
      case 'completed': return 'पूर्ण / Completed';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'payment_completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'payment_initiated': return <CreditCard size={16} className="text-blue-600" />;
      case 'deal_accepted': return <Package size={16} className="text-purple-600" />;
      default: return <Clock size={16} className="text-yellow-600" />;
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Welcome & Notification Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">नमस्ते व्यापारी!</h2>
            <p className="text-blue-100 text-sm">Welcome Trader!</p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{totalProduce}</p>
          <p className="text-sm text-gray-600 font-medium">उपलब्ध फसलें</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-orange-100">
          <p className="text-2xl font-bold text-orange-600">{activeBids}</p>
          <p className="text-sm text-gray-600 font-medium">सक्रिय बोलियां</p>
        </div>
      </div>

      {/* Purchase Tracking Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">खरीदारी ट्रैकिंग / Purchase Tracking</h3>
          <button onClick={() => setShowPaymentDetails(!showPaymentDetails)} className="text-blue-600 text-sm">
            {showPaymentDetails ? 'छुपाएं' : 'विवरण'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-4 border-b flex space-x-2 overflow-x-auto">
          {['all', 'pending', 'payment', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium text-gray-800">Deal #{transaction.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">₹{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-3">
                <button className="flex-1 py-2 px-4 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  View Details
                </button>
                <button
                  onClick={() => setDisputingTxId(transaction.id)}
                  className="flex-1 py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex justify-center items-center gap-2"
                >
                  <AlertTriangle size={16} /> विवाद / Dispute
                </button>
              </div>

              {/* Dispute Form */}
              {disputingTxId === transaction.id && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">Describe the issue:</p>
                  <textarea
                    className="w-full p-2 border rounded-md text-sm mb-2"
                    rows={3}
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    placeholder="e.g., Quality mismatch..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => { setDisputingTxId(null); setDisputeReason(''); }} className="px-3 py-1 text-sm bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={() => submitDispute(transaction.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Submit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Market Opportunities */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">बाज़ार के अवसर / Market Opportunities</h3>
        <div className="space-y-3">
          {availableProduce.slice(0, 3).map((produce) => (
            <div key={produce.id} className="flex items-center space-x-4 p-3 border rounded-lg">
              <img src={produce.images[0]} alt={produce.name} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{produce.name}</p>
                <p className="text-xs text-gray-500">{produce.location}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₹{produce.currentPrice}</p>
                <button className="mt-1 p-1 bg-blue-100 rounded-full"><Eye size={14} className="text-blue-600" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraderDashboard;