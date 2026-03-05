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
import { api } from '../../lib/api'; // Make sure this path is correct based on your folder structure

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

  // Backend Integration State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting and Calculations
  const sortedBids = [...(produce.bids || [])].sort((a, b) => b.amount - a.amount);
  const highestBid = sortedBids[0];
  const averageBid = sortedBids.length > 0
    ? Math.round(sortedBids.reduce((sum, bid) => sum + bid.amount, 0) / sortedBids.length)
    : 0;

  // Modified Submit Handler to hit the backend
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError("Please enter a valid bid amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Call our custom Express Backend to place the bid
      // produce.id is the listing_id. currentUserId is the trader_id.
      await api.placeBid(
        produce.id,
        currentUserId,
        parseFloat(bidAmount),
        parseFloat(bidQuantity),
        message.trim() || undefined
      );

      // 2. Call the parent prop to update local UI state immediately (optimistic UI update)
      onPlaceBid({
        traderId: currentUserId,
        traderName: 'You (Current Trader)', // In a real app, fetch from auth context
        amount: parseFloat(bidAmount),
        quantity: parseFloat(bidQuantity),
        message: message.trim() || undefined,
        status: 'pending'
      });

      // 3. Reset Form
      setBidAmount('');
      setMessage('');
      setShowBidForm(false);
      alert("Bid placed successfully!");

    } catch (err: any) {
      console.error("Failed to place bid:", err);
      setError(err.message || "An error occurred while placing your bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'अभी / Just now';
    const now = new Date();
    const bidTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - bidTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'अभी / Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} मिनट पहले / ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} घंटे पहले / ${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)} दिन पहले / ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const suggestedBid = highestBid ? highestBid.amount + 50 : (produce.basePrice || 0) + 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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
              src={produce.images?.[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"}
              alt={produce.name}
              className="w-20 h-20 rounded-xl object-cover border border-gray-100"
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
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">{produce.description}</p>
            </div>
          )}
        </div>

        {/* Bidding Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md text-center border border-gray-50">
            <p className="text-2xl font-bold text-green-600">
              {highestBid ? `₹${highestBid.amount}` : '₹0'}
            </p>
            <p className="text-sm text-gray-600">सर्वोच्च बोली</p>
            <p className="text-xs text-gray-500">Highest Bid</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md text-center border border-gray-50">
            <p className="text-2xl font-bold text-blue-600">
              {averageBid ? `₹${averageBid}` : '₹0'}
            </p>
            <p className="text-sm text-gray-600">औसत बोली</p>
            <p className="text-xs text-gray-500">Average Bid</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md text-center border border-gray-50">
            <p className="text-2xl font-bold text-orange-600">{sortedBids.length}</p>
            <p className="text-sm text-gray-600">कुल बोलियां</p>
            <p className="text-xs text-gray-500">Total Bids</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Quick Bid Button */}
        {!showBidForm && (
          <div className="space-y-3">
            <button
              onClick={() => setShowBidForm(true)}
              className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg flex justify-center items-center gap-2"
            >
              <Rupee size={20} /> बोली लगाएं / Place Bid
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
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-5 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b-2 border-green-500 pb-1">अपनी बोली दें</h4>
              <button
                onClick={() => setShowBidForm(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    बोली राशि / Bid Amount *
                  </label>
                  <div className="relative">
                    <Rupee size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={suggestedBid.toString()}
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    required
                    max={produce.quantity}
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">अधिकतम: {produce.quantity} {produce.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  संदेश (वैकल्पिक) / Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="कोई विशेष शर्त या संदेश (Optional)..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-20 resize-none transition-shadow"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  रद्द करें / Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !bidAmount}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>प्रक्रिया...</span>
                    </>
                  ) : (
                    "बोली जमा करें / Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Bids List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800">वर्तमान बोलियां</h4>
            <p className="text-sm text-gray-600">Current Bids ({sortedBids.length})</p>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {sortedBids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-600">अभी तक कोई बोली नहीं</p>
                <p className="text-sm text-gray-400">No bids yet - be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedBids.map((bid, index) => (
                  <div
                    key={bid.id || index}
                    className={`p-3 rounded-lg border ${index === 0 ? 'border-green-300 bg-green-50 shadow-sm' : 'border-gray-200 bg-gray-50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-inner">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-800">{bid.traderName || 'Trader'}</p>
                            {index === 0 && (
                              <span className="bg-green-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">
                                सर्वोच्च / Top
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {formatTimeAgo(bid.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-lg">₹{bid.amount}</p>
                        <p className="text-sm text-gray-600">{bid.quantity} {produce.unit}</p>
                      </div>
                    </div>

                    {bid.message && (
                      <div className="mt-3 p-2.5 bg-white rounded-md border border-gray-100 text-sm text-gray-600 italic">
                        "{bid.message}"
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

// I added X from lucide-react, make sure to import it at the top!
import { X } from 'lucide-react';

export default EnhancedBiddingSystem;