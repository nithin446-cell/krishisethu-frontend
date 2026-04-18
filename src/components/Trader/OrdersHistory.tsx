import React, { useEffect, useState } from 'react';
import { ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

interface TraderOrdersHistoryProps {
    traderId: string;
}

const TraderOrdersHistory: React.FC<TraderOrdersHistoryProps> = ({ traderId }) => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
            *,
            crop_listings (variety, unit, current_price, location),
            farmer:users!orders_farmer_id_fkey (full_name)
          `)
                    .eq('trader_id', traderId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err: any) {
                console.error('Error fetching orders:', err.message);
            } finally {
                setLoading(false);
            }
        };

        if (traderId) fetchOrders();
    }, [traderId]);

    const statusColor = (status: string) => {
        switch (status) {
            case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <LoadingSpinner message={t('order.loadingOrders')} />;

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">{t('order.myOrders')}</h2>
                <p className="text-indigo-100 text-sm">{t('order.purchases')}</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">{t('order.noOrders')}</p>
                    <p className="text-sm text-gray-400">{t('order.noOrdersDesc')}</p>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-gray-800">
                                    {order.crop_listings?.variety || t('order.crop')}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {t('transaction.farmer')}: {order.farmer?.full_name || '—'}
                                </p>
                                <p className="text-xs text-gray-400">{order.crop_listings?.location}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor(order.status)}`}>
                                {t(`order.status.${order.status}`)}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                            <div className="text-center">
                                <p className="text-gray-400 text-xs">{t('order.paidLabel')}</p>
                                <p className="font-bold text-green-700">₹{order.final_amount?.toLocaleString()}</p>
                            </div>
                            <div className="text-center border-x border-gray-200">
                                <p className="text-gray-400 text-xs">{t('transaction.unit')}</p>
                                <p className="font-semibold text-gray-800">{order.crop_listings?.unit}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 text-xs">{t('transaction.date')}</p>
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

export default TraderOrdersHistory;
