import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, TriangleAlert as AlertTriangle, TrendingUp, FileText, DollarSign, Eye, UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import Papa from 'papaparse'; // Ensure you run: npm install papaparse

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
  adminId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, adminId }) => {
  // Backend Integration States
  const [liveDisputes, setLiveDisputes] = useState<any[]>([]);
  const [liveMarket, setLiveMarket] = useState<any[]>([]);
  const [completedTrades, setCompletedTrades] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch initial open disputes & setup Realtime Subscription
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Disputes
      const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (disputes) setLiveDisputes(disputes);

      // Fetch Live Market (Listings with Bids) based on the new API
      try {
        const market = await api.getAdminBids();
        if (market) setLiveMarket(market);
      } catch (err) {
        console.error("Failed to load admin bids:", err);
      }

      // Fetch Completed Trades (Orders) based on the new API
      try {
        const trades = await api.getAdminOrders();
        if (trades) setCompletedTrades(trades);
      } catch (err) {
        console.error("Failed to load admin orders:", err);
      }
    };

    fetchData();

    // Subscribe to incoming disputes
    const channel = supabase.channel('admin_disputes_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'disputes' }, (payload) => {
        setLiveDisputes((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. REFINED: Handle CSV Upload via PapaParse (Production Standard)
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batchId = `BATCH-${Date.now()}`;

          // Map CSV data to our Database Schema (adding audit fields)
          const mappedUpdates = results.data.map((row: any) => ({
            bid_id: row.bid_id,
            historical_amount: parseFloat(row.amount || row.historical_amount),
            updated_by: adminId,
            upload_batch_id: batchId,
          }));

          if (mappedUpdates.length === 0) throw new Error("CSV appears to be empty or formatted incorrectly.");

          // Bulk Insert into Supabase
          const { error: insertError } = await supabase
            .from('bid_history')
            .insert(mappedUpdates);

          if (insertError) throw insertError;

          // Create an entry in the Admin Log for tracking
          await supabase.from('admin_logs').insert({
            admin_id: adminId,
            action: 'Bulk Price Update',
            target_table: 'bid_history',
            details: { batch_id: batchId, count: mappedUpdates.length }
          });

          alert(`Successfully updated ${mappedUpdates.length} records in bid_history!`);
        } catch (err: any) {
          console.error("CSV Error:", err);
          alert("Error processing CSV: " + err.message);
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        alert("Parsing Error: " + error.message);
        setIsUploading(false);
      }
    });
  };

  // UI Stats (Dynamic count for Disputes)
  const stats = [
    { title: 'Total Users', value: 1247, icon: Users, change: '+12%' },
    { title: 'Pending Verifications', value: 12, icon: Shield, change: '+5' },
    { title: 'Active Disputes', value: liveDisputes.length, icon: AlertTriangle, change: 'Live' },
    { title: 'Total Transactions', value: 856, icon: DollarSign, change: '+8%' }
  ];

  const quickActions = [
    { id: 'verification', title: 'Verify Traders', description: 'Review pending verifications', icon: Shield, color: 'bg-blue-600', section: 'verification' },
    { id: 'disputes', title: 'Resolve Disputes', description: 'Handle disputes', icon: AlertTriangle, color: 'bg-red-600', section: 'disputes' },
    { id: 'prices', title: 'Update Prices', description: 'Upload market prices', icon: TrendingUp, color: 'bg-green-600', section: 'prices' },
    { id: 'schemes', title: 'Manage Schemes', description: 'Manage government schemes', icon: FileText, color: 'bg-purple-600', section: 'schemes' }
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Admin Dashboard</h2>
            <p className="text-indigo-100 text-sm">Platform Control Center</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon as any;
          const isActiveDispute = s.title === 'Active Disputes' && liveDisputes.length > 0;
          return (
            <div key={i} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">{s.title}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActiveDispute ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'
                  }`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSV Bulk Upload (PapaParse Integrated) */}
      <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
          <UploadCloud className="text-indigo-600" size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Bulk Update Bids</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">Upload a CSV with <b>bid_id</b> and <b>amount</b> to update historical data.</p>

        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" id="csvUpload" />
        <label htmlFor="csvUpload" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md cursor-pointer flex items-center gap-2 hover:bg-indigo-700 transition font-medium">
          {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
          {isUploading ? 'Processing CSV...' : 'Select CSV File'}
        </label>
      </div>

      {/* Real-Time Live Disputes Tracker */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={18} /> Open Disputes
          </h3>
          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
            LIVE
          </span>
        </div>

        <div className="p-4 space-y-3">
          {liveDisputes.length === 0 ? (
            <p className="text-gray-400 text-sm italic text-center py-4">No active disputes.</p>
          ) : (
            liveDisputes.map((dispute) => (
              <div key={dispute.id} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-gray-400">ORDER: {dispute.order_id?.split('-')[0]}...</span>
                  <span className="text-[10px] text-gray-400">{new Date(dispute.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{dispute.reason}</p>
                <button onClick={() => onNavigate('disputes')} className="mt-2 text-xs font-bold text-red-600 hover:underline">
                  RESOLVE CASE →
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions List */}
      <div className="space-y-3">
        <h3 className="text-md font-bold text-gray-800 ml-1">System Management</h3>
        {quickActions.map((action) => {
          const Icon = action.icon as any;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.section)}
              className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4"
            >
              <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                <Icon size={20} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-800 text-sm">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              <Eye size={16} className="text-gray-300" />
            </button>
          );
        })}
      </div>

      {/* Live Market View Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mt-6">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={18} /> Live Market View
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2 border-b">Crop / Variety</th>
                <th className="px-4 py-2 border-b">Farmer</th>
                <th className="px-4 py-2 border-b">Base Price</th>
                <th className="px-4 py-2 border-b">Active Bids</th>
              </tr>
            </thead>
            <tbody>
              {liveMarket.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500 italic">No active listings found.</td></tr>
              ) : (
                liveMarket.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{item.name || item.variety || 'Unknown'}</td>
                      <td className="px-4 py-2 text-gray-600">{item.users?.full_name || 'Unknown'}</td>
                      <td className="px-4 py-2 text-green-600 font-medium">₹{item.current_price}</td>
                      <td className="px-4 py-2">
                        {item.bids?.length || 0} span
                      </td>
                    </tr>
                    {item.bids && item.bids.length > 0 && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={4} className="px-8 py-2">
                          <div className="text-xs text-gray-600">
                            <strong>Current Bids:</strong>
                            <ul className="list-disc ml-4 mt-1">
                              {item.bids.map((bid: any) => (
                                <li key={bid.id}>
                                  {bid.users?.full_name || 'Trader'} bid ₹{bid.amount} for {bid.quantity} {item.unit} ({bid.status})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Trades View Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mt-6">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="text-blue-500" size={18} /> Completed Trades View
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2 border-b">Date</th>
                <th className="px-4 py-2 border-b">Crop</th>
                <th className="px-4 py-2 border-b">Farmer Name</th>
                <th className="px-4 py-2 border-b">Winning Trader</th>
                <th className="px-4 py-2 border-b text-right">Final Amount</th>
              </tr>
            </thead>
            <tbody>
              {completedTrades.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500 italic">No completed trades yet.</td></tr>
              ) : (
                completedTrades.map(trade => (
                  <tr key={trade.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{new Date(trade.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{trade.crop_listings?.variety || trade.crop_listings?.name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-gray-600">{trade.users_farmer?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-gray-600">{trade.users_trader?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-blue-600 font-bold text-right">₹{trade.final_amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;