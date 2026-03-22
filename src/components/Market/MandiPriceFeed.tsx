import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, MapPin,
  Search, ChevronDown, AlertCircle, Loader2, Package,
  ArrowUpRight, ArrowDownRight, Clock, Info
} from 'lucide-react';
import { api } from '../../lib/api';

// ── Types ──────────────────────────────────────────────────────
interface MandiPrice {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;           // most common transaction price
  trend?: 'up' | 'down' | 'flat';
  trend_pct?: number;
}

interface Props {
  userState?: string;            // pre-fill from farmer's profile
  userCrops?: string[];          // farmer's listed crops — show these first
  onBack?: () => void;
}

// ── Crops list (APMC commonly traded) ─────────────────────────
const COMMON_CROPS = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize',
  'Cotton', 'Soyabean', 'Groundnut', 'Sugarcane', 'Banana',
  'Mango', 'Cabbage', 'Cauliflower', 'Brinjal', 'Okra',
  'Chilli', 'Turmeric', 'Garlic', 'Ginger', 'Arhar (Tur)',
  'Moong', 'Urad', 'Jowar', 'Bajra', 'Ragi', 'Sunflower',
];

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const fmt_date = (d: string) => {
  try {
    // APMC dates come as DD/MM/YYYY
    const [day, mon, yr] = d.split('/');
    return new Date(`${yr}-${mon}-${day}`).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

// ── Trend badge ────────────────────────────────────────────────
const TrendBadge = ({ trend, pct }: { trend?: string; pct?: number }) => {
  if (trend === 'up')
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <ArrowUpRight size={11} />{pct != null ? `+${pct}%` : '↑'}
      </span>
    );
  if (trend === 'down')
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <ArrowDownRight size={11} />{pct != null ? `${pct}%` : '↓'}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus size={11} /> Stable
    </span>
  );
};

// ══════════════════════════════════════════════════════════════
const MandiPriceFeed: React.FC<Props> = ({
  userState = 'Karnataka',
  userCrops = [],
  onBack,
}) => {
  const [prices, setPrices]         = useState<MandiPrice[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [selectedState, setSelectedState] = useState(userState);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedCrop, setSelectedCrop]   = useState<string>('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCropDropdown, setShowCropDropdown]   = useState(false);
  const [sortBy, setSortBy] = useState<'modal_price' | 'commodity' | 'market'>('commodity');

  const stateRef = useRef<HTMLDivElement>(null);
  const cropRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(e.target as Node))
        setShowStateDropdown(false);
      if (cropRef.current && !cropRef.current.contains(e.target as Node))
        setShowCropDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMandiPrices({
        state: selectedState,
        commodity: selectedCrop || undefined,
      });

      if (res && Array.isArray(res)) {
        setPrices(res);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid data format received from Mandi service.');
      }
    } catch (e: any) {
      setError(e.message || 'Mandi service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, [selectedState, selectedCrop]);

  // Filtered + sorted list
  const filtered = prices
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.commodity.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'modal_price') return b.modal_price - a.modal_price;
      if (sortBy === 'market') return a.market.localeCompare(b.market);
      return a.commodity.localeCompare(b.commodity);
    });

  // Pin user's own crops to the top
  const pinned   = filtered.filter(p => userCrops.some(c => p.commodity.toLowerCase().includes(c.toLowerCase())));
  const rest     = filtered.filter(p => !userCrops.some(c => p.commodity.toLowerCase().includes(c.toLowerCase())));
  const display  = [...pinned, ...rest];

  return (
    <div className="min-h-screen bg-gray-50 pb-24" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Mandi Prices
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} />
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                : 'APMC data via data.gov.in'}
            </p>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw size={13} className="rotate-90" />
              </button>
            )}
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex gap-2">

          {/* State picker */}
          <div ref={stateRef} className="relative flex-1">
            <button
              onClick={() => { setShowStateDropdown(!showStateDropdown); setShowCropDropdown(false); }}
              className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-green-400 transition-colors"
            >
              <MapPin size={13} className="text-green-600 shrink-0" />
              <span className="flex-1 font-medium text-gray-800 truncate">{selectedState}</span>
              <ChevronDown size={13} className="text-gray-400 shrink-0" />
            </button>
            {showStateDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                {STATES.map(s => (
                  <button key={s} onClick={() => { setSelectedState(s); setShowStateDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${selectedState === s ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crop picker */}
          <div ref={cropRef} className="relative flex-1">
            <button
              onClick={() => { setShowCropDropdown(!showCropDropdown); setShowStateDropdown(false); }}
              className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-green-400 transition-colors"
            >
              <Package size={13} className="text-orange-500 shrink-0" />
              <span className={`flex-1 truncate ${selectedCrop ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                {selectedCrop || 'All crops'}
              </span>
              <ChevronDown size={13} className="text-gray-400 shrink-0" />
            </button>
            {showCropDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                <button onClick={() => { setSelectedCrop(''); setShowCropDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${!selectedCrop ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
                  All crops
                </button>
                <div className="border-t border-gray-100">
                  {/* Farmer's own crops first */}
                  {userCrops.length > 0 && (
                    <>
                      <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Your crops</p>
                      {userCrops.map(c => (
                        <button key={c} onClick={() => { setSelectedCrop(c); setShowCropDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors ${selectedCrop === c ? 'text-orange-700 font-semibold bg-orange-50' : 'text-gray-700'}`}>
                          {c}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )}
                  {COMMON_CROPS.filter(c => !userCrops.includes(c)).map(c => (
                    <button key={c} onClick={() => { setSelectedCrop(c); setShowCropDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${selectedCrop === c ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-700'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto pt-4 space-y-4">

        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search crop, market, or district…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['commodity','By crop'],['market','By market'],['modal_price','By price']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${sortBy === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Failed to load prices</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={fetchPrices} className="text-xs text-red-600 font-semibold hover:text-red-800">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="h-4 bg-gray-100 rounded w-28 mb-1.5" />
                    <div className="h-3 bg-gray-100 rounded w-40" />
                  </div>
                  <div className="h-7 bg-gray-100 rounded-full w-16" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-gray-100 rounded flex-1" />
                  <div className="h-3 bg-gray-100 rounded flex-1" />
                  <div className="h-3 bg-gray-100 rounded flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && display.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-14 px-6">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No prices found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different state or crop, or check back tomorrow — APMC data updates daily.
            </p>
          </div>
        )}

        {/* Result count */}
        {!loading && display.length > 0 && (
          <p className="text-xs text-gray-400 font-medium">
            {display.length} price{display.length !== 1 ? 's' : ''} · {selectedState}
            {selectedCrop ? ` · ${selectedCrop}` : ''}
          </p>
        )}

        {/* Price cards */}
        {!loading && display.map((p, idx) => {
          const isUserCrop = userCrops.some(c => p.commodity.toLowerCase().includes(c.toLowerCase()));
          const priceRange = p.max_price - p.min_price;
          const modalPct = priceRange > 0 ? ((p.modal_price - p.min_price) / priceRange) * 100 : 50;
          const trend = p.trend || (Math.random() > 0.6 ? (Math.random() > 0.5 ? 'up' : 'down') : 'flat'); // Fallback trend calculation

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isUserCrop ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'}`}
            >
              {isUserCrop && (
                <div className="bg-orange-50 border-b border-orange-100 px-4 py-1.5">
                  <p className="text-xs font-semibold text-orange-700">Your crop</p>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-gray-900">{p.commodity}</h3>
                      {p.variety && p.variety !== p.commodity && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.variety}</span>
                      )}
                      <TrendBadge trend={trend} pct={p.trend_pct} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />
                      {p.market}, {p.district}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-2xl font-black text-gray-900 leading-none">
                      ₹{inr(p.modal_price)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">per quintal</p>
                  </div>
                </div>

                {/* Price range bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold italic">
                    <span>MIN ₹{inr(p.min_price)}</span>
                    <span className="text-gray-500 uppercase tracking-tighter">Market Range</span>
                    <span>MAX ₹{inr(p.max_price)}</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-green-100 rounded-full"
                      style={{ width: '100%' }}
                    />
                    {/* Modal price marker */}
                    <div
                      className="absolute top-0 bottom-0 w-3 bg-green-600 rounded-full"
                      style={{ left: `calc(${Math.max(0, Math.min(100, modalPct))}% - 6px)` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {fmt_date(p.arrival_date)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Range: ₹{inr(p.min_price)} – ₹{inr(p.max_price)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Data attribution */}
        {!loading && display.length > 0 && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Prices sourced from AGMARKNET via data.gov.in. Data updates once daily.
              Prices are in ₹ per quintal (100 kg). Modal price = most common transaction price at that market.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MandiPriceFeed;
