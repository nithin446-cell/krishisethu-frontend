import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface MandiPriceBadgeProps {
  cropName: string;
  state?: string;
  className?: string;
}

/**
 * Premium Mandi Price Badge
 * Shows today's modal price for a specific crop.
 * If 'state' is provided, it prioritizes a match within that state.
 */
const MandiPriceBadge: React.FC<MandiPriceBadgeProps> = ({ cropName, state, className = '' }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch top 5 prices for this crop to find a good match
        const results = await api.getTopMandiPrices(cropName, 5);
        if (results && Array.isArray(results) && results.length > 0) {
          // If state is provided, try to find a match in that state first
          let match = results[0];
          if (state) {
            const stateMatch = results.find((r: any) => 
              r.state.toLowerCase().includes(state.toLowerCase())
            );
            if (stateMatch) match = stateMatch;
          }
          setPrice(match.modal_price);
        }
      } catch (err) {
        console.error('[MandiBadge Error]', err);
      } finally {
        setLoading(false);
      }
    };

    if (cropName) fetchData();
  }, [cropName, state]);

  if (loading) return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg animate-pulse ${className}`}>
      <Loader2 size={10} className="animate-spin text-gray-300" />
      <div className="h-2 w-12 bg-gray-200 rounded" />
    </div>
  );

  if (!price) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-100 rounded-lg shadow-sm group hover:bg-green-100 transition-colors ${className}`}>
      <TrendingUp size={12} className="text-green-600" />
      <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight whitespace-nowrap">
        Mandi: ₹{new Intl.NumberFormat('en-IN').format(price)}/qtl
      </span>
    </div>
  );
};

export default MandiPriceBadge;
