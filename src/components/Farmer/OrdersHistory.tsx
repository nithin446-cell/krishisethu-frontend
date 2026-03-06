import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Clock, IndianRupee as Rupee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';

interface FarmerOrdersHistoryProps {
    farmerId: string;
}

const FarmerOrdersHistory: React.FC<FarmerOrdersHistoryProps> = ({ farmerId }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
            *,
            crop_listings (variety, unit, current_price),
            trader:users!orders_trader_id_fkey (full_name)
          `)
                    .eq('farmer_id', farmerId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error: any) {
                console.error('Error fetching orders:', error.message);
            } finally {
                setLoading(false);
            }
        };

        if (farmerId) fetchOrders();
    }, [farmerId]);

    const statusColor = (status: string) => {
        switch (status) {
            case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <LoadingSpinner message="Loading order history..." />;

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">ऑर्डर इतिहास</h2>
                <p className="text-green-100 text-sm">Your Completed Deals</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No orders yet</p>
                    <p className="text-sm text-gray-400">Orders appear here after a bid is accepted</p>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-gray-800">
                                    {order.crop_listings?.variety || 'Crop'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Trader: {order.trader?.full_name || '—'}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor(order.status)}`}>
                                {order.status?.replace('_', ' ') || 'Unknown'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 rounded-lg p-3">
                            <div className="text-center">
                                <p className="text-gray-500 text-xs">Amount</p>
                                <p className="font-bold text-green-700">₹{order.final_amount?.toLocaleString()}</p>
                            </div>
                            <div className="text-center border-x border-gray-200">
                                <p className="text-gray-500 text-xs">Unit</p>
                                <p className="font-semibold text-gray-800">{order.crop_listings?.unit || '—'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-500 text-xs">Date</p>
                                <p className="font-semibold text-gray-800">
                                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default FarmerOrdersHistory;
