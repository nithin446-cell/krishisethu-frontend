import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, List, BarChart2 } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const EnhancedMarketPrices = () => {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'compare'
  const [trendFilter, setTrendFilter] = useState('All'); // 'All', 'Rising', 'Falling', 'Stable'
  const [compareCrop, setCompareCrop] = useState('All Produces');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Fetch Initial Data
  const fetchPrices = async () => {
    try {
      const data = await api.getLiveMarketPrices();
      setPrices(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch market prices", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Setup WebSocket Connection (Real-Time)
  useEffect(() => {
    fetchPrices();

    // Listen for any new CSV uploads from the Admin!
    const channel = supabase.channel('market_prices_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_prices' }, (payload) => {
        console.log("Realtime Update Received!", payload);
        fetchPrices(); // Re-fetch the data instantly when a change occurs
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 3. Mathematical Trend Logic
  const getTrend = (min: number, max: number, modal: number) => {
    if (!min || !max || !modal) return 'Stable';
    const midPoint = (min + max) / 2;
    if (modal > midPoint + (midPoint * 0.05)) return 'Rising'; // Modal is 5% higher than midpoint
    if (modal < midPoint - (midPoint * 0.05)) return 'Falling'; // Modal is 5% lower than midpoint
    return 'Stable';
  };

  // 4. Filter Logic (Search + Trend + Compare)
  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      // Search Filter (Crop name or Mandi name)
      const matchesSearch = 
        price.crop_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        price.market_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Trend Filter
      const trend = getTrend(price.min_price, price.max_price, price.modal_price);
      const matchesTrend = trendFilter === 'All' || trend === trendFilter;

      // Compare Filter
      const matchesCompare = activeTab === 'compare' 
        ? (compareCrop === 'All Produces' || price.crop_name === compareCrop)
        : true;

      return matchesSearch && matchesTrend && matchesCompare;
    });
  }, [prices, searchQuery, trendFilter, activeTab, compareCrop]);

  // Extract unique crops for the Compare dropdown
  const uniqueCrops = ['All Produces', ...Array.from(new Set(prices.map(p => p.crop_name)))];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Blue Header */}
      <div className="bg-blue-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              मंडी भाव <span className="ml-2 bg-green-500 text-xs px-2 py-0.5 rounded-full animate-pulse flex items-center">● LIVE</span>
            </h2>
            <p className="text-blue-100 text-sm">Real-time Market Prices</p>
            <p className="text-blue-200 text-xs mt-1 flex items-center">
              <RefreshCw size={12} className="mr-1" />
              अपडेट: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500 p-2 rounded-full mb-1">
              <RefreshCw size={20} className="text-white" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">रियल टाइम</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex bg-white shadow-sm border-b">
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          <List size={16} className="mr-2" /> सूची / List
        </button>
        <button onClick={() => setActiveTab('compare')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center ${activeTab === 'compare' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          <BarChart2 size={16} className="mr-2" /> तुलना / Compare
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="फसल या मंडी खोजें / Search crops or mandi" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Trend Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Rising', 'Falling', 'Stable'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setTrendFilter(filter)}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${trendFilter === filter ? 'bg-blue-600 text-white shadow-md' : 'bg-white border text-gray-600'}`}
            >
              {filter === 'Rising' && <TrendingUp size={16} className="mr-1 text-green-500" />}
              {filter === 'Falling' && <TrendingDown size={16} className="mr-1 text-red-500" />}
              {filter === 'Stable' && <Minus size={16} className="mr-1 text-gray-400" />}
              {filter}
            </button>
          ))}
        </div>

        {/* Compare Dropdown (Only visible on Compare Tab) */}
        {activeTab === 'compare' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">फसल चुनें / Select Produce for Comparison</label>
            <select 
              value={compareCrop}
              onChange={(e) => setCompareCrop(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
            >
              {uniqueCrops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </div>
        )}

        {/* Data Rendering */}
        {filteredPrices.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">कोई मंडी भाव नहीं मिला</p>
            <p className="text-gray-400 text-sm">No market prices found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrices.map((price) => {
              const trend = getTrend(price.min_price, price.max_price, price.modal_price);
              return (
                <div key={price.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{price.crop_name}</h3>
                      <p className="text-sm text-gray-500">Variety: {price.variety || 'Standard'}</p>
                    </div>
                    
                    {/* Trend Badge */}
                    <span className={`flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${trend === 'Rising' ? 'bg-green-100 text-green-700' : trend === 'Falling' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {trend === 'Rising' && <TrendingUp size={12} className="mr-1" />}
                      {trend === 'Falling' && <TrendingDown size={12} className="mr-1" />}
                      {trend === 'Stable' && <Minus size={12} className="mr-1" />}
                      {trend}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                    <MapPin size={16} className="text-blue-500 mr-2" />
                    <span className="font-medium">{price.market_name}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t pt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Min</p>
                      <p className="font-semibold text-gray-700">₹{price.min_price}</p>
                    </div>
                    <div className="text-center border-l border-r">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Modal (Avg)</p>
                      <p className="font-bold text-blue-600 text-lg">₹{price.modal_price}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Max</p>
                      <p className="font-semibold text-gray-700">₹{price.max_price}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMarketPrices;