import React, { useState } from 'react';
import { Clock, User, MessageCircle, IndianRupee as Rupee } from 'lucide-react';
import { Produce, Bid } from '../../types';

interface BiddingSystemProps {
  produce: Produce;
  onPlaceBid: (bid: Omit<Bid, 'id' | 'timestamp'>) => void;
  currentUserId: string;
}

const BiddingSystem: React.FC<BiddingSystemProps> = ({ 
  produce, 
  onPlaceBid, 
  currentUserId 
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bidQuantity, setBidQuantity] = useState(produce.quantity.toString());
  const [message, setMessage] = useState('');

  const sortedBids = [...produce.bids].sort((a, b) => b.amount - a.amount);
  const highestBid = sortedBids[0];

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) return;
    
    onPlaceBid({
      traderId: currentUserId,
      traderName: 'Current Trader', // In real app, get from user context
      amount: parseFloat(bidAmount),
      quantity: parseFloat(bidQuantity),
      message: message.trim() || undefined,
      status: 'pending'
    });
    
    setBidAmount('');
    setMessage('');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const bidTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - bidTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'अभी / Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} मिनट पहले / ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} घंटे पहले / ${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)} दिन पहले / ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Produce Details */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <div className="flex space-x-4">
          <img 
            src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
            alt={produce.name}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{produce.name}</h3>
            {produce.variety && <p className="text-sm text-gray-600">{produce.variety}</p>}
            <p className="text-lg font-semibold text-green-600 mt-1">
              ₹{produce.basePrice}/{produce.unit}
            </p>
            <p className="text-sm text-gray-500">{produce.quantity} {produce.unit} उपलब्ध</p>
          </div>
        </div>
      </div>

      {/* Current Bids */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">वर्तमान बोलियां</h4>
              <p className="text-sm text-gray-600">Current Bids</p>
            </div>
            {highestBid && (
              <div className="text-right">
                <p className="text-sm text-gray-600">सर्वोच्च बोली</p>
                <p className="text-xl font-bold text-green-600">₹{highestBid.amount}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {sortedBids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>अभी तक कोई बोली नहीं</p>
              <p className="text-sm">No bids yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBids.map((bid, index) => (
                <div 
                  key={bid.id} 
                  className={`p-3 rounded-lg border ${
                    index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{bid.traderName}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(bid.timestamp)}</p>
                      </div>
                      {index === 0 && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          सर्वोच्च
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-800">₹{bid.amount}</p>
                      <p className="text-sm text-gray-600">{bid.quantity} {produce.unit}</p>
                    </div>
                  </div>
                  
                  {bid.message && (
                    <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border">
                      "{bid.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Place Bid Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">बोली लगाएं</h4>
        
        <form onSubmit={handleSubmitBid} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                बोली राशि / Bid Amount *
              </label>
              <div className="relative">
                <Rupee size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  min={produce.basePrice}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                मात्रा / Quantity *
              </label>
              <input
                type="number"
                value={bidQuantity}
                onChange={(e) => setBidQuantity(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                max={produce.quantity}
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              संदेश (वैकल्पिक) / Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="कोई विशेष शर्त या संदेश..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-16 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            बोली जमा करें / Submit Bid
          </button>
        </form>
      </div>
    </div>
  );
};

export default BiddingSystem;