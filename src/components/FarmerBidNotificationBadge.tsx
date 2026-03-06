import React from 'react';
import { useFarmerBidNotifications, BidNotification } from '../lib/websocket';

interface FarmerBidNotificationBadgeProps {
    farmerId: string;
}

/**
 * Farmer component to show incoming bid notifications
 */
export const FarmerBidNotificationBadge: React.FC<FarmerBidNotificationBadgeProps> = ({ farmerId }) => {
    const { newBids } = useFarmerBidNotifications(farmerId);

    return (
        <div className="notification-badge">
            {newBids.length > 0 && (
                <span className="badge-count">{newBids.length}</span>
            )}
            <div className="notification-list">
                {newBids.slice(0, 5).map((bid: BidNotification, index: number) => (
                    <div key={bid.bid_id ?? index} className="notification-item">
                        <p>
                            <strong>{bid.trader_name ?? 'A trader'}</strong> bid ₹{bid.amount} for {bid.quantity} units
                        </p>
                        <time>{new Date(bid.timestamp ?? Date.now()).toLocaleTimeString()}</time>
                    </div>
                ))}
            </div>
        </div>
    );
};
