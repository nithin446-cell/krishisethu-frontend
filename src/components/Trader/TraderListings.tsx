import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Package, 
  Star,
  Shield,
  Clock,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Produce } from '../../types';

interface TraderListingsProps {
  produces: Produce[];
  onViewProduce: (produce: Produce) => void;
}

const TraderListings: React.FC<TraderListingsProps> = ({ produces, onViewProduce }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [quantityRange, setQuantityRange] = useState({ min: '', max: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const cropTypes = [...new Set(produces.map(p => p.name))];
  const locations = [...new Set(produces.map(p => p.location))];

  const filteredProduces = produces
    .filter(produce => {
      const matchesSearch = produce.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           produce.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (produce.variety && produce.variety.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCrop = selectedCrop === 'all' || produce.name === selectedCrop;
      const matchesLocation = selectedLocation === 'all' || produce.location === selectedLocation;
      
      const matchesQuantity = (!quantityRange.min || produce.quantity >= parseInt(quantityRange.min)) &&
                             (!quantityRange.max || produce.quantity <= parseInt(quantityRange.max));
      
      const matchesPrice = (!priceRange.min || produce.currentPrice >= parseInt(priceRange.min)) &&
                          (!priceRange.max || produce.currentPrice <= parseInt(priceRange.max));
      
      const matchesVerified = !verifiedOnly || produce.verified;
      
      return matchesSearch && matchesCrop && matchesLocation && matchesQuantity && 
             matchesPrice && matchesVerified && produce.status === 'active';
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low': return a.currentPrice - b.currentPrice;
        case 'price_high': return b.currentPrice - a.currentPrice;
        case 'quantity_high': return b.quantity - a.quantity;
        case 'quantity_low': return a.quantity - b.quantity;
        case 'location': return a.location.localeCompare(b.location);
        case 'bids': return b.bids.length - a.bids.length;
        default: return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
      }
    });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'अभी / Just now';
    if (diffInHours < 24) return `${diffInHours} घंटे पहले / ${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)} दिन पहले / ${Math.floor(diffInHours / 24)}d ago`;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCrop('all');
    setSelectedLocation('all');
    setQuantityRange({ min: '', max: '' });
    setPriceRange({ min: '', max: '' });
    setVerifiedOnly(false);
    setSortBy('newest');
  };

  const activeFiltersCount = [
    selectedCrop !== 'all',
    selectedLocation !== 'all',
    quantityRange.min || quantityRange.max,
    priceRange.min || priceRange.max,
    verifiedOnly
  ].filter(Boolean).length;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">उपलब्ध फसलें</h2>
            <p className="text-blue-100 text-sm">Available Produce for Trading</p>
            <p className="text-blue-200 text-xs mt-1">{filteredProduces.length} listings found</p>
          </div>
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="फसल, किस्म या स्थान खोजें / Search crops, variety or location"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Toggle and Quick Filters */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>फिल्टर / Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Shield size={16} className="text-green-600" />
            <span className="text-gray-700">केवल सत्यापित / Verified Only</span>
          </label>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">उन्नत फिल्टर / Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crop Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                फसल प्रकार / Crop Type
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">सभी फसलें / All Crops</option>
                {cropTypes.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                स्थान / Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">सभी स्थान / All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Quantity Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                मात्रा सीमा / Quantity Range (Quintals)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="न्यूनतम"
                  value={quantityRange.min}
                  onChange={(e) => setQuantityRange({ ...quantityRange, min: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="अधिकतम"
                  value={quantityRange.max}
                  onChange={(e) => setQuantityRange({ ...quantityRange, max: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                मूल्य सीमा / Price Range (₹ per quintal)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="न्यूनतम"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="अधिकतम"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              क्रमबद्ध करें / Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">नवीनतम / Newest First</option>
              <option value="price_low">कम कीमत / Price: Low to High</option>
              <option value="price_high">अधिक कीमत / Price: High to Low</option>
              <option value="quantity_high">अधिक मात्रा / Quantity: High to Low</option>
              <option value="quantity_low">कम मात्रा / Quantity: Low to High</option>
              <option value="location">स्थान के अनुसार / By Location</option>
              <option value="bids">सबसे अधिक बोलियां / Most Bids</option>
            </select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              सभी फिल्टर साफ़ करें / Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{filteredProduces.length} परिणाम मिले / results found</span>
        {activeFiltersCount > 0 && (
          <span>{activeFiltersCount} फिल्टर सक्रिय / filters active</span>
        )}
      </div>

      {/* Produce Listings */}
      <div className="space-y-4">
        {filteredProduces.map((produce) => (
          <div 
            key={produce.id} 
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewProduce(produce)}
          >
            <div className="flex">
              <img 
                src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
                alt={produce.name}
                className="w-24 h-24 object-cover"
              />
              
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{produce.name}</h3>
                      {produce.verified && (
                        <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                          <Shield size={12} className="text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Verified</span>
                        </div>
                      )}
                      {produce.bids.length > 0 && (
                        <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                          <Star size={12} className="text-orange-600" />
                          <span className="text-xs text-orange-700 font-medium">
                            {produce.bids.length} bids
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {produce.variety && (
                      <p className="text-sm text-gray-600 mb-1">किस्म: {produce.variety}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{produce.location}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">₹{produce.currentPrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">per {produce.unit}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Package size={14} />
                      <span>{produce.quantity} {produce.unit}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatTimeAgo(produce.harvestDate)}</span>
                    </div>
                  </div>
                  
                  <button className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                    <Eye size={16} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {produce.description && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {produce.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProduces.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">कोई फसल नहीं मिली</p>
          <p className="text-sm text-gray-400 mb-4">No produce found matching your criteria</p>
          <button 
            onClick={clearAllFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            फिल्टर साफ़ करें / Clear Filters
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {filteredProduces.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <h4 className="font-semibold text-gray-800 mb-3">त्वरित आंकड़े / Quick Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="font-bold text-blue-600">
                ₹{Math.min(...filteredProduces.map(p => p.currentPrice)).toLocaleString()}
              </p>
              <p className="text-blue-700">न्यूनतम मूल्य / Min Price</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="font-bold text-green-600">
                ₹{Math.max(...filteredProduces.map(p => p.currentPrice)).toLocaleString()}
              </p>
              <p className="text-green-700">अधिकतम मूल्य / Max Price</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraderListings;