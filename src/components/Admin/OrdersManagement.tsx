import React, { useEffect, useState } from 'react';
import { ShoppingBag, User, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';

const OrdersManagement: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
            *,
            crop_listings (variety, unit),
            farmer:users!orders_farmer_id_fkey (full_name, phone),
            trader:users!orders_trader_id_fkey (full_name, phone)
          `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err: any) {
                console.error('Error fetching orders:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const statusColor = (status: string) => {
        switch (status) {
            case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) return <LoadingSpinner message="Loading orders..." />;

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">Orders Management</h2>
                <p className="text-slate-300 text-sm">{orders.length} total orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No orders yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-gray-800">{order.crop_listings?.variety || 'Crop'}</p>
                                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusColor(order.status)}`}>
                                    {order.status?.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                                    <User size={14} className="text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-400">Farmer</p>
                                        <p className="font-medium text-gray-800">{order.farmer?.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2">
                                    <User size={14} className="text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-400">Trader</p>
                                        <p className="font-medium text-gray-800">{order.trader?.full_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-sm text-gray-500">{order.crop_listings?.unit}</p>
                                <p className="font-bold text-green-700 text-lg">₹{order.final_amount?.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersManagement;
