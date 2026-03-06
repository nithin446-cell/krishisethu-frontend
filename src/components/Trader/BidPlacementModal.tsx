import React, { useState } from 'react';
import { X, IndianRupee as Rupee, Package, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';

interface BidPlacementModalProps {
    produce: {
        id: string;
        name: string;
        variety?: string;
        quantity: number;
        unit: string;
        basePrice?: number;
        currentPrice?: number;
        farmerName?: string;
        bids?: any[];
    };
    traderId: string;
    traderName?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const BidPlacementModal: React.FC<BidPlacementModalProps> = ({
    produce, traderId, traderName, onClose, onSuccess
}) => {
    const basePrice = produce.basePrice || produce.currentPrice || 0;
    const highestBid = produce.bids?.length
        ? Math.max(...produce.bids.map((b: any) => b.amount))
        : 0;
    const suggestedBid = highestBid ? highestBid + 50 : basePrice + 100;

    const [bidAmount, setBidAmount] = useState(suggestedBid.toString());
    const [bidQuantity, setBidQuantity] = useState(produce.quantity.toString());
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const amount = parseFloat(bidAmount);
        const quantity = parseFloat(bidQuantity);

        if (!amount || amount < basePrice) {
            setError(`Bid must be at least ₹${basePrice}`);
            return;
        }
        if (!quantity || quantity > produce.quantity) {
            setError(`Quantity must be between 1 and ${produce.quantity} ${produce.unit}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await api.placeBid(produce.id, traderId, amount, quantity, message.trim() || undefined);
            onSuccess();
            onClose();
            alert('Bid placed successfully! 🎉');
        } catch (err: any) {
            setError(err.message || 'Failed to place bid. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">बोली लगाएं</h2>
                        <p className="text-sm text-gray-500">Place Bid on {produce.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Produce Summary */}
                <div className="p-5 bg-green-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Package size={22} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800">{produce.name}</p>
                            {produce.variety && <p className="text-xs text-gray-500">{produce.variety}</p>}
                            <p className="text-sm text-gray-600">{produce.quantity} {produce.unit} · {produce.farmerName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-green-700">₹{basePrice}</p>
                            <p className="text-xs text-gray-500">Base price</p>
                        </div>
                    </div>

                    {highestBid > 0 && (
                        <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                            <TrendingUp size={14} className="text-orange-500" />
                            <span className="text-xs text-gray-600">Current highest bid: <strong className="text-orange-600">₹{highestBid}</strong></span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                बोली राशि / Bid Amount *
                            </label>
                            <div className="relative">
                                <Rupee size={16} className="absolute left-3 top-3.5 text-gray-400" />
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={e => setBidAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    min={basePrice}
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Min: ₹{basePrice}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                मात्रा / Quantity *
                            </label>
                            <input
                                type="number"
                                value={bidQuantity}
                                onChange={e => setBidQuantity(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                min="1"
                                max={produce.quantity}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Max: {produce.quantity} {produce.unit}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            संदेश / Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Any special terms or conditions..."
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-20 resize-none"
                        />
                    </div>

                    {/* Total Preview */}
                    {bidAmount && bidQuantity && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-blue-700">Total Offer Value</span>
                            <span className="font-bold text-blue-800 text-lg">
                                ₹{(parseFloat(bidAmount) * parseFloat(bidQuantity)).toLocaleString()}
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Submit Bid'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BidPlacementModal;
