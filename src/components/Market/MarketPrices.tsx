import React, { useState } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, Minus, MapPin } from 'lucide-react';
import { MarketPrice } from '../../types';

interface MarketPricesProps {
  prices: MarketPrice[];
}

const MarketPrices: React.FC<MarketPricesProps> = ({ prices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.produce.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.mandi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'trending' && price.trend === 'up') ||
                         (selectedFilter === 'falling' && price.trend === 'down');
    
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">मंडी भाव</h2>
        <p className="text-sm text-gray-600">Market Prices</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="फसल या मंडी खोजें / Search crops or mandi"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'सभी', labelEn: 'All' },
            { key: 'trending', label: 'बढ़ते', labelEn: 'Rising' },
            { key: 'falling', label: 'गिरते', labelEn: 'Falling' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Price List */}
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
                  <span className={`text-sm font-semibold ${
                    price.change > 0 ? 'text-green-600' : 
                    price.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {price.change > 0 ? '+' : ''}{price.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">कोई मंडी भाव नहीं मिला</p>
          <p className="text-sm text-gray-400">No market prices found</p>
        </div>
      )}
    </div>
  );
};

export default MarketPrices;