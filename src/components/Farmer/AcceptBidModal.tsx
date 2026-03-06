import React, { useState } from 'react';
import { CheckCircle, X, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

interface AcceptBidModalProps {
    bid: {
        id: string;
        amount: number;
        quantity: number;
        listing_id?: string;
        users?: { full_name: string };
    };
    listingId: string;
    unit: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AcceptBidModal: React.FC<AcceptBidModalProps> = ({ bid, listingId, unit, onClose, onSuccess }) => {
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);
        try {
            await api.acceptBid(bid.id, listingId);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to accept bid. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">बोली स्वीकार करें</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            Accepting this bid will <strong>reject all other offers</strong> and mark this listing as sold.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Trader</span>
                            <span className="font-semibold text-gray-800">{bid.users?.full_name || 'Trader'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Bid Amount</span>
                            <span className="font-semibold text-green-700">₹{bid.amount} / {unit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Quantity</span>
                            <span className="font-semibold text-gray-800">{bid.quantity} {unit}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                            <span className="text-gray-700 font-medium">Total Value</span>
                            <span className="font-bold text-green-700 text-base">₹{(bid.amount * bid.quantity).toLocaleString()}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-5 pt-0">
                    <button
                        onClick={onClose}
                        disabled={isAccepting}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        रद्द करें
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
                    >
                        {isAccepting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Accept Bid
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptBidModal;
