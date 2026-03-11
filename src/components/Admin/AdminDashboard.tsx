import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, Package, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchAdminData = async () => {
    try {
      const data = await api.getAdminDashboard();
      setOrders(Array.isArray(data) ? data : (data?.data || []));
    } catch (error: any) {
      console.error("Admin fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    // WebSockets: Admin sees changes live as well!
    const channel = supabase.channel('admin_updates_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAdminData();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleResolveDispute = async (orderId: string, action: 'refund_trader' | 'force_complete') => {
    const msg = action === 'force_complete' 
      ? "Force Complete? This marks the payment as successfully received by the farmer."
      : "Refund Trader? This will cancel the order and mark the payment as refunded.";
      
    if (!window.confirm(msg)) return;

    setActionLoading(orderId);
    try {
      await api.resolveDispute(orderId, action);
      alert("Dispute resolved successfully!");
      fetchAdminData();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.final_amount) || 0), 0);
  const disputedOrders = orders.filter(o => o.status === 'disputed');
  const completedOrders = orders.filter(o => o.status === 'completed' && o.payment_status === 'paid');

  const filteredOrders = orders.filter(o => {
    if (filter === 'disputed') return o.status === 'disputed';
    if (filter === 'completed') return o.status === 'completed' && o.payment_status === 'paid';
    return true;
  });

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 text-sm">Monitor all marketplace transactions</p>
        </div>
        <button onClick={fetchAdminData} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
          <RefreshCw size={20} className="text-indigo-600" />
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Volume Traveled</p>
            <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600"><Package size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed Deals</p>
            <p className="text-2xl font-bold text-gray-800">{completedOrders.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-200 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600"><ShieldAlert size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Disputes</p>
            <p className="text-2xl font-bold text-red-600">{disputedOrders.length}</p>
          </div>
        </div>
      </div>

      {/* ALL TRANSACTIONS & DISPUTES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex space-x-2">
          {['all', 'completed', 'disputed'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No orders found for this filter.</p>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`border rounded-lg p-4 ${order.status === 'disputed' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Order #{order.id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-600">Crop: {order.crop_listings?.variety} | Amount: <span className="font-bold text-green-700">₹{order.final_amount}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === 'disputed' ? 'bg-red-600 text-white' : 
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'disputed' ? 'DISPUTED' : order.payment_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md border">
                  <div>
                    <p className="font-semibold text-gray-800">🧑‍🌾 Farmer</p>
                    <p>{order.farmer?.full_name}</p>
                    <p>{order.farmer?.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">🛒 Trader</p>
                    <p>{order.trader?.full_name}</p>
                    <p>{order.trader?.phone}</p>
                  </div>
                </div>

                {/* DISPUTE RESOLUTION PANEL */}
                {order.status === 'disputed' && (
                  <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm mt-2">
                    <p className="text-red-700 text-sm font-semibold mb-3 flex items-center">
                      <ShieldAlert size={16} className="mr-2"/> 
                      Farmer reported payment NOT received. Please investigate.
                    </p>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleResolveDispute(order.id, 'force_complete')}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center"
                      >
                        <CheckCircle size={16} className="mr-1"/> Force Complete (Paid)
                      </button>
                      <button 
                        onClick={() => handleResolveDispute(order.id, 'refund_trader')}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center"
                      >
                        <XCircle size={16} className="mr-1"/> Cancel & Refund Trader
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;