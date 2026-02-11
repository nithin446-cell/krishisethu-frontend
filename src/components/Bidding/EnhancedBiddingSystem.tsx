import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  MessageCircle, 
  IndianRupee as Rupee, 
  ArrowLeft,
  Phone,
  Shield,
  TrendingUp,
  Package
} from 'lucide-react';
import { Produce, Bid } from '../../types';

interface EnhancedBiddingSystemProps {
  produce: Produce;
  onPlaceBid: (bid: Omit<Bid, 'id' | 'timestamp'>) => void;
  currentUserId: string;
  onBack: () => void;
  onContactFarmer: () => void;
}

const EnhancedBiddingSystem: React.FC<EnhancedBiddingSystemProps> = ({ 
  produce, 
  onPlaceBid, 
  currentUserId,
  onBack,
  onContactFarmer
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bidQuantity, setBidQuantity] = useState(produce.quantity.toString());
  const [message, setMessage] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);

  const sortedBids = [...produce.bids].sort((a, b) => b.amount - a.amount);
  const highestBid = sortedBids[0];
  const averageBid = sortedBids.length > 0 
    ? Math.round(sortedBids.reduce((sum, bid) => sum + bid.amount, 0) / sortedBids.length)
    : 0;

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) return;
    
    onPlaceBid({
      traderId: currentUserId,
      traderName: 'Current Trader',
      amount: parseFloat(bidAmount),
      quantity: parseFloat(bidQuantity),
      message: message.trim() || undefined,
      status: 'pending'
    });
    
    setBidAmount('');
    setMessage('');
    setShowBidForm(false);
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

  const suggestedBid = highestBid ? highestBid.amount + 50 : produce.basePrice + 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">बोली लगाएं</h1>
            <p className="text-sm text-gray-600">Place Your Bid</p>
          </div>
          <button
            onClick={onContactFarmer}
            className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
          >
            <Phone size={20} className="text-green-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Produce Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex space-x-4">
            <img 
              src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
              alt={produce.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{produce.name}</h3>
                <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                  <Shield size={12} className="text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Verified</span>
                </div>
              </div>
              
              {produce.variety && <p className="text-sm text-gray-600 mb-1">{produce.variety}</p>}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{produce.basePrice}/{produce.unit}
                  </p>
                  <p className="text-sm text-gray-500">न्यूनतम कीमत / Base Price</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Package size={16} className="text-gray-500" />
                    <span className="font-medium">{produce.quantity} {produce.unit}</span>
                  </div>
                  <p className="text-sm text-gray-500">उपलब्ध / Available</p>
                </div>
              </div>
            </div>
          </div>
          
          {produce.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{produce.description}</p>
            </div>
          )}
        </div>

        {/* Bidding Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-2xl font-bold text-green-600">
              {highestBid ? `₹${highestBid.amount}` : '₹0'}
            </p>
            <p className="text-sm text-gray-600">सर्वोच्च बोली</p>
            <p className="text-xs text-gray-500">Highest Bid</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-2xl font-bold text-blue-600">
              {averageBid ? `₹${averageBid}` : '₹0'}
            </p>
            <p className="text-sm text-gray-600">औसत बोली</p>
            <p className="text-xs text-gray-500">Average Bid</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-2xl font-bold text-orange-600">{sortedBids.length}</p>
            <p className="text-sm text-gray-600">कुल बोलियां</p>
            <p className="text-xs text-gray-500">Total Bids</p>
          </div>
        </div>

        {/* Quick Bid Button */}
        {!showBidForm && (
          <div className="space-y-3">
            <button
              onClick={() => setShowBidForm(true)}
              className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              बोली लगाएं / Place Bid
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">सुझावित बोली</p>
                  <p className="text-sm text-blue-700">
                    ₹{suggestedBid} - बेहतर मौका पाने के लिए
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bid Form */}
        {showBidForm && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">अपनी बोली दें</h4>
              <button
                onClick={() => setShowBidForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    बोली राशि / Bid Amount *
                  </label>
                  <div className="relative">
                    <Rupee size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={suggestedBid.toString()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      min={produce.basePrice}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">न्यूनतम: ₹{produce.basePrice}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <p className="text-xs text-gray-500 mt-1">अधिकतम: {produce.quantity} {produce.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  संदेश (वैकल्पिक) / Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="कोई विशेष शर्त या संदेश..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-16 resize-none"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  रद्द करें / Cancel
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  बोली जमा करें / Submit Bid
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Bids */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800">वर्तमान बोलियां</h4>
            <p className="text-sm text-gray-600">Current Bids ({sortedBids.length})</p>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {sortedBids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">अभी तक कोई बोली नहीं</p>
                <p className="text-sm">No bids yet - be the first!</p>
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
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-800">{bid.traderName}</p>
                            {index === 0 && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                सर्वोच्च
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{formatTimeAgo(bid.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-800">₹{bid.amount}</p>
                        <p className="text-sm text-gray-600">{bid.quantity} {produce.unit}</p>
                      </div>
                    </div>
                    
                    {bid.message && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <p className="text-sm text-gray-600">"{bid.message}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBiddingSystem;