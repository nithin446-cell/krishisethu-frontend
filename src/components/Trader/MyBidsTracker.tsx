import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, CheckCircle, XCircle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';

interface MyBidsTrackerProps {
    traderId: string;
}

const MyBidsTracker: React.FC<MyBidsTrackerProps> = ({ traderId }) => {
    const [bids, setBids] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const { data, error } = await supabase
                    .from('bids')
                    .select(`
            *,
            crop_listings (variety, current_price, unit, status, location)
          `)
                    .eq('trader_id', traderId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setBids(data || []);
            } catch (err: any) {
                console.error('Error fetching bids:', err.message);
            } finally {
                setLoading(false);
            }
        };

        if (traderId) fetchBids();
    }, [traderId]);

    const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
        pending: {
            label: 'Pending',
            icon: <Clock size={14} />,
            color: 'bg-yellow-100 text-yellow-700',
        },
        accepted: {
            label: 'Accepted ✓',
            icon: <CheckCircle size={14} />,
            color: 'bg-green-100 text-green-700',
        },
        rejected: {
            label: 'Rejected',
            icon: <XCircle size={14} />,
            color: 'bg-red-100 text-red-700',
        },
    };

    const formatTimeAgo = (iso: string) => {
        const diffMs = Date.now() - new Date(iso).getTime();
        const hours = Math.floor(diffMs / 3_600_000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) return <LoadingSpinner message="Loading your bids..." />;

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">मेरी बोलियां</h2>
                <p className="text-blue-100 text-sm">My Active &amp; Past Bids</p>
                <p className="text-blue-200 text-xs mt-1">{bids.length} total bids placed</p>
            </div>

            {bids.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed">
                    <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No bids placed yet</p>
                    <p className="text-sm text-gray-400">Visit the marketplace to place your first bid</p>
                </div>
            ) : (
                bids.map(bid => {
                    const sc = statusConfig[bid.status] || statusConfig.pending;
                    return (
                        <div key={bid.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Package size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {bid.crop_listings?.variety || 'Crop'}
                                        </p>
                                        <p className="text-xs text-gray-500">{bid.crop_listings?.location || '—'}</p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sc.color}`}>
                                    {sc.icon} {sc.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                                <div className="text-center">
                                    <p className="text-gray-400 text-xs">Your Bid</p>
                                    <p className="font-bold text-green-700">₹{bid.amount}</p>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <p className="text-gray-400 text-xs">Quantity</p>
                                    <p className="font-semibold text-gray-800">{bid.quantity} {bid.crop_listings?.unit}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400 text-xs">Placed</p>
                                    <p className="font-semibold text-gray-800">{formatTimeAgo(bid.created_at)}</p>
                                </div>
                            </div>

                            {bid.message && (
                                <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 rounded-lg p-2">
                                    "{bid.message}"
                                </p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MyBidsTracker;
