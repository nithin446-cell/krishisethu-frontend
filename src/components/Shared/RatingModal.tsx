import React, { useState } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface RatingModalProps {
  orderId: string;
  rateeRole: 'farmer' | 'trader'; // Role of the person being rated
  rateeName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  orderId,
  rateeRole,
  rateeName,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.submitRating(orderId, { rating, comment });
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl px-6 pt-6 pb-10 animate-slide-up"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-green-600 fill-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">Thank you!</p>
            <p className="text-gray-500 mt-1 text-sm">Your rating has been submitted.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-lg font-bold text-gray-900">Rate your experience</p>
              <p className="text-sm text-gray-500 mt-1">
                How was your transaction with <span className="font-semibold text-gray-700">{rateeName}</span>?
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={42}
                    className="transition-colors"
                    style={{
                      color: star <= (hovered || rating) ? colors[hovered || rating] : '#d1d5db',
                      fill: star <= (hovered || rating) ? colors[hovered || rating] : 'transparent',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Label */}
            <p
              className="text-center text-base font-semibold mb-6 h-6 transition-all"
              style={{ color: colors[hovered || rating] || 'transparent' }}
            >
              {labels[hovered || rating]}
            </p>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)…"
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 resize-none transition-colors"
            />

            {error && (
              <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl transition-all"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting…</>
              ) : (
                <><Send size={16} /> Submit Rating</>
              )}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RatingModal;
