import React, { useEffect, useState } from 'react';
import { TrendingUp, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';

const BiddingActivity: React.FC = () => {
    const [bids, setBids] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const { data, error } = await supabase
                    .from('bids')
                    .select(`
            *,
            crop_listings (variety, unit, current_price),
            users!bids_trader_id_fkey (full_name)
          `)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setBids(data || []);
            } catch (err: any) {
                console.error('Error fetching bids:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBids();
    }, []);

    const statusColor = (s: string) => {
        if (s === 'accepted') return 'bg-green-100 text-green-700';
        if (s === 'rejected') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    const formatAgo = (iso: string) => {
        const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    if (loading) return <LoadingSpinner message="Loading bidding activity..." />;

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">Bidding Activity</h2>
                <p className="text-orange-100 text-sm">{bids.length} bids across the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total', value: bids.length, color: 'text-gray-800' },
                    { label: 'Accepted', value: bids.filter(b => b.status === 'accepted').length, color: 'text-green-700' },
                    { label: 'Pending', value: bids.filter(b => b.status === 'pending').length, color: 'text-yellow-700' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {bids.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed">
                    <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No bids yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {bids.map(bid => (
                        <div key={bid.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">
                                    {bid.users?.full_name || 'Trader'} → {bid.crop_listings?.variety || 'Crop'}
                                </p>
                                <p className="text-xs text-gray-400">{formatAgo(bid.created_at)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-gray-800">₹{bid.amount}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(bid.status)}`}>
                                    {bid.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BiddingActivity;
