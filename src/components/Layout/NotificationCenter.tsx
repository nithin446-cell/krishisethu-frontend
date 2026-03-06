import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, TrendingUp, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Notification {
    id: string;
    type: 'bid' | 'order' | 'accepted';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

interface NotificationCenterProps {
    userId: string;
    userRole: 'farmer' | 'trader' | 'admin';
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const notifs: Notification[] = [];

                if (userRole === 'farmer') {
                    // Fetch recent bids on farmer's listings
                    const { data: bids } = await supabase
                        .from('bids')
                        .select('id, amount, quantity, created_at, crop_listings!inner(farmer_id, variety)')
                        .eq('crop_listings.farmer_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    (bids || []).forEach((bid: any) => {
                        notifs.push({
                            id: bid.id,
                            type: 'bid',
                            title: 'New Bid Received',
                            message: `₹${bid.amount} bid on ${bid.crop_listings?.variety || 'your listing'}`,
                            time: bid.created_at,
                            read: false,
                        });
                    });
                } else if (userRole === 'trader') {
                    // Fetch accepted/rejected bids for trader
                    const { data: bids } = await supabase
                        .from('bids')
                        .select('id, amount, status, created_at, crop_listings(variety)')
                        .eq('trader_id', userId)
                        .in('status', ['accepted', 'rejected'])
                        .order('created_at', { ascending: false })
                        .limit(10);

                    (bids || []).forEach((bid: any) => {
                        notifs.push({
                            id: bid.id,
                            type: bid.status === 'accepted' ? 'accepted' : 'order',
                            title: bid.status === 'accepted' ? '🎉 Bid Accepted!' : 'Bid Rejected',
                            message: `Your ₹${bid.amount} bid on ${bid.crop_listings?.variety} was ${bid.status}`,
                            time: bid.created_at,
                            read: false,
                        });
                    });
                }

                setNotifications(notifs);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchNotifications();
    }, [userId, userRole]);

    const formatTime = (iso: string) => {
        const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const iconFor = (type: string) => {
        if (type === 'bid') return <TrendingUp size={18} className="text-blue-500" />;
        if (type === 'accepted') return <CheckCircle size={18} className="text-green-500" />;
        return <ShoppingBag size={18} className="text-red-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-16 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-green-600" />
                        <h2 className="font-bold text-gray-800">Notifications</h2>
                        {notifications.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {notifications.length}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Bell size={36} className="mb-2 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map(notif => (
                                <div key={notif.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {iconFor(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm">{notif.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatTime(notif.time)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
