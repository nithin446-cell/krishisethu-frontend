import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  MapPin, 
  TrendingUp,
  BarChart3,
  RefreshCw,
  Target,
  Activity,
  Clock
} from 'lucide-react';
import { MarketPrice } from '../../types';

interface EnhancedMarketPricesProps {
  prices: MarketPrice[];
}

const EnhancedMarketPrices: React.FC<EnhancedMarketPricesProps> = ({ prices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'comparison' | 'nearby'>('list');
  const [selectedProduce, setSelectedProduce] = useState<string>('');

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.produce.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.mandi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'trending' && price.trend === 'up') ||
                         (selectedFilter === 'falling' && price.trend === 'down') ||
                         (selectedFilter === 'stable' && price.trend === 'stable');
    
    return matchesSearch && matchesFilter;
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp size={20} className="text-green-600" />;
      case 'down': return <ArrowDown size={20} className="text-red-600" />;
      default: return <Minus size={20} className="text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHighestLowestPrices = (produceName: string) => {
    const produceData = prices.filter(p => p.produce === produceName);
    if (produceData.length === 0) return { highest: 0, lowest: 0, average: 0, mandis: [] };
    
    const priceValues = produceData.map(p => p.price);
    const highest = Math.max(...priceValues);
    const lowest = Math.min(...priceValues);
    const average = Math.round(priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length);
    
    const highestMandi = produceData.find(p => p.price === highest)?.mandi || '';
    const lowestMandi = produceData.find(p => p.price === lowest)?.mandi || '';
    
    return { 
      highest, 
      lowest, 
      average, 
      mandis: produceData,
      highestMandi,
      lowestMandi
    };
  };

  const uniqueProduces = [...new Set(prices.map(p => p.produce))];

  const nearbyAPMCs = [
    { name: 'Pune APMC', distance: '5 km', status: 'open' },
    { name: 'Baramati APMC', distance: '45 km', status: 'open' },
    { name: 'Nashik APMC', distance: '165 km', status: 'closed' },
    { name: 'Mumbai APMC', distance: '150 km', status: 'open' },
    { name: 'Aurangabad APMC', distance: '235 km', status: 'open' }
  ];

  const getLastUpdatedTime = () => {
    const now = new Date();
    const minutes = Math.floor(Math.random() * 10) + 1;
    return `${minutes} मिनट पहले / ${minutes} min ago`;
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header with Real-time Status */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-xl font-bold">मंडी भाव</h2>
              <div className="flex items-center space-x-1 bg-green-500 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">LIVE</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm">Real-time Market Prices</p>
            <div className="flex items-center space-x-1 text-blue-200 text-xs mt-1">
              <Clock size={12} />
              <span>अपडेट: {getLastUpdatedTime()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-blue-500 rounded-full hover:bg-blue-400 transition-colors">
              <RefreshCw size={20} />
            </button>
            <div className="text-right">
              <p className="text-sm">रियल टाइम</p>
              <p className="text-xs">Real Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📋 सूची / List
        </button>
        <button
          onClick={() => setViewMode('comparison')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'comparison'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📊 तुलना / Compare
        </button>
        <button
          onClick={() => setViewMode('nearby')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'nearby'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📍 नजदीकी / Nearby
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="फसल या मंडी खोजें / Search crops or mandi"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'सभी', labelEn: 'All', icon: '📊' },
            { key: 'trending', label: 'बढ़ते', labelEn: 'Rising', icon: '📈' },
            { key: 'falling', label: 'गिरते', labelEn: 'Falling', icon: '📉' },
            { key: 'stable', label: 'स्थिर', labelEn: 'Stable', icon: '➖' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        /* Enhanced List View with Price Indicators */
        <div className="space-y-3">
          {filteredPrices.map((price) => (
            <div 
              key={price.id} 
              className={`bg-white border rounded-xl shadow-sm p-4 ${getTrendColor(price.trend)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{price.produce}</h3>
                    {getTrendIcon(price.trend)}
                    <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                      <Activity size={12} className="text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Live</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="mr-1" />
                    <span>{price.mandi}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    अपडेट: {new Date(price.lastUpdated).toLocaleString('hi-IN')}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">₹{price.price}</p>
                  <p className="text-sm text-gray-600">प्रति क्विंटल</p>
                  
                  <div className="flex items-center justify-end mt-2">
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      price.change > 0 ? 'text-green-700 bg-green-100' : 
                      price.change < 0 ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100'
                    }`}>
                      {price.change > 0 ? '+' : ''}{price.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'comparison' && (
        /* Enhanced Comparison View with Highest/Lowest/Average */
        <div className="space-y-4">
          {/* Produce Selector */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              फसल चुनें / Select Produce for Comparison
            </label>
            <select
              value={selectedProduce}
              onChange={(e) => setSelectedProduce(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">सभी फसलें / All Produces</option>
              {uniqueProduces.map((produce) => (
                <option key={produce} value={produce}>{produce}</option>
              ))}
            </select>
          </div>

          {(selectedProduce ? [selectedProduce] : uniqueProduces).map((produce) => {
            const { highest, lowest, average, mandis, highestMandi, lowestMandi } = getHighestLowestPrices(produce);
            
            return (
              <div key={produce} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{produce}</h3>
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    <span className="text-sm text-gray-600">{mandis.length} मंडियां</span>
                  </div>
                </div>
                
                {/* Price Statistics Cards */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <ArrowUp size={16} className="text-green-600" />
                      <p className="text-sm text-green-600 font-medium">सर्वोच्च / Highest</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">₹{highest}</p>
                    <p className="text-xs text-green-600 mt-1">{highestMandi}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Target size={16} className="text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">औसत / Average</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">₹{average}</p>
                    <p className="text-xs text-blue-600 mt-1">{mandis.length} मंडियों का औसत</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <ArrowDown size={16} className="text-red-600" />
                      <p className="text-sm text-red-600 font-medium">न्यूनतम / Lowest</p>
                    </div>
                    <p className="text-2xl font-bold text-red-700">₹{lowest}</p>
                    <p className="text-xs text-red-600 mt-1">{lowestMandi}</p>
                  </div>
                </div>

                {/* Price Range Indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>₹{lowest}</span>
                    <span className="font-medium">मूल्य सीमा / Price Range</span>
                    <span>₹{highest}</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                    <div 
                      className="absolute top-0 w-3 h-3 bg-blue-600 rounded-full transform -translate-y-0.5"
                      style={{ 
                        left: `${((average - lowest) / (highest - lowest)) * 100}%`,
                        transform: 'translateX(-50%) translateY(-2px)'
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs text-blue-600 font-medium">औसत स्थिति</span>
                  </div>
                </div>
                
                {/* Individual Mandi Prices */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">मंडी-वार कीमतें:</p>
                  {mandis.map((price) => (
                    <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-700">{price.mandi}</span>
                        {price.price === highest && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            सर्वोच्च
                          </span>
                        )}
                        {price.price === lowest && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            न्यूनतम
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">₹{price.price}</span>
                        {getTrendIcon(price.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'nearby' && (
        /* Nearby APMC Comparison */
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">नजदीकी APMC मंडियां</h3>
            </div>
            
            <div className="space-y-3">
              {nearbyAPMCs.map((apmc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{apmc.name}</p>
                      <p className="text-sm text-gray-600">{apmc.distance} दूर</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      apmc.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {apmc.status === 'open' ? 'खुला / Open' : 'बंद / Closed'}
                    </div>
                    
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      कीमतें देखें
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Price Comparison for Nearby Markets */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">त्वरित मूल्य तुलना</h4>
            
            <div className="space-y-3">
              {uniqueProduces.slice(0, 3).map((produce) => {
                const produceData = prices.filter(p => p.produce === produce);
                const nearbyPrices = produceData.slice(0, 3);
                
                return (
                  <div key={produce} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-2">{produce}</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {nearbyPrices.map((price) => (
                        <div key={price.id} className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">{price.mandi.split(' ')[0]}</p>
                          <p className="font-semibold text-sm">₹{price.price}</p>
                          <div className="flex items-center justify-center">
                            {getTrendIcon(price.trend)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filteredPrices.length === 0 && viewMode === 'list' && (
        <div className="text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">कोई मंडी भाव नहीं मिला</p>
          <p className="text-sm text-gray-400">No market prices found</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedMarketPrices;