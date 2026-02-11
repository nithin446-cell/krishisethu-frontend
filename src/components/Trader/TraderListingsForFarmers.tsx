import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Shield,
  Eye,
  Star,
  Building,
  Phone,
  MessageCircle
} from 'lucide-react';
import { User, Produce } from '../../types';

interface TraderListingsForFarmersProps {
  traders: User[];
  myProduce: Produce[];
  onContactTrader: (trader: User) => void;
}

const TraderListingsForFarmers: React.FC<TraderListingsForFarmersProps> = ({ 
  traders, 
  myProduce,
  onContactTrader 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showOnlyInterested, setShowOnlyInterested] = useState(false);

  const locations = [...new Set(traders.map(t => t.location))];

  // Mock data for traders interested in farmer's produce
  const traderInterests = {
    '550e8400-e29b-41d4-a716-446655440002': ['गेहूं (Wheat)', 'धान (Rice)'],
    '550e8400-e29b-41d4-a716-446655440003': ['गेहूं (Wheat)'],
    '550e8400-e29b-41d4-a716-446655440004': ['धान (Rice)', 'मक्का (Maize)']
  };

  const mockTraders: User[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'श्याम व्यापारी',
      phone: '+91-9876543211',
      type: 'trader',
      location: 'APMC Market, Pune',
      verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'राज एंटरप्राइजेज',
      phone: '+91-9876543212',
      type: 'trader',
      location: 'Mumbai APMC',
      verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'गुप्ता ट्रेडिंग',
      phone: '+91-9876543213',
      type: 'trader',
      location: 'Delhi Mandi',
      verified: false
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'महाराष्ट्र एग्रो',
      phone: '+91-9876543214',
      type: 'trader',
      location: 'Nashik APMC',
      verified: true
    }
  ];

  const filteredTraders = mockTraders.filter(trader => {
    const matchesSearch = trader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trader.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || trader.location === selectedLocation;
    const matchesInterest = !showOnlyInterested || 
                           (traderInterests[trader.id as keyof typeof traderInterests]?.some(crop => 
                             myProduce.some(p => p.name === crop)
                           ));
    
    return matchesSearch && matchesLocation && matchesInterest;
  });

  const getInterestedCrops = (traderId: string) => {
    return traderInterests[traderId as keyof typeof traderInterests] || [];
  };

  const getMatchingProduceCount = (traderId: string) => {
    const interests = getInterestedCrops(traderId);
    return myProduce.filter(p => interests.includes(p.name)).length;
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">सक्रिय व्यापारी</h2>
            <p className="text-purple-100 text-sm">Active Traders</p>
            <p className="text-purple-200 text-xs mt-1">{filteredTraders.length} traders browsing</p>
          </div>
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            <Building size={24} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="व्यापारी या स्थान खोजें / Search traders or location"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-500 flex-shrink-0" />
          
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">सभी स्थान / All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <button
            onClick={() => setShowOnlyInterested(!showOnlyInterested)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              showOnlyInterested
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            रुचि रखने वाले / Interested Only
          </button>
        </div>
      </div>

      {/* Traders List */}
      <div className="space-y-4">
        {filteredTraders.map((trader) => {
          const interestedCrops = getInterestedCrops(trader.id);
          const matchingCount = getMatchingProduceCount(trader.id);
          
          return (
            <div 
              key={trader.id} 
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {trader.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{trader.name}</h3>
                      {trader.verified && (
                        <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                          <Shield size={12} className="text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{trader.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onContactTrader(trader)}
                    className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                  >
                    <MessageCircle size={16} className="text-green-600" />
                  </button>
                  
                  <button className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                    <Phone size={16} className="text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Interested Crops */}
              {interestedCrops.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    रुचि रखते हैं / Interested in:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {interestedCrops.map((crop, index) => {
                      const isMyProduce = myProduce.some(p => p.name === crop);
                      return (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isMyProduce
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {crop}
                          {isMyProduce && (
                            <span className="ml-1">✓</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Match Indicator */}
              {matchingCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {matchingCount} आपकी फसलों में रुचि / {matchingCount} matches with your produce
                    </span>
                  </div>
                </div>
              )}

              {/* Trader Stats */}
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">4.8</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">25+</p>
                  <p className="text-xs text-gray-500">Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">98%</p>
                  <p className="text-xs text-gray-500">Success</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTraders.length === 0 && (
        <div className="text-center py-12">
          <Building size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">कोई व्यापारी नहीं मिला</p>
          <p className="text-sm text-gray-400">No traders found matching your criteria</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedLocation('all');
              setShowOnlyInterested(false);
            }}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            फिल्टर साफ़ करें / Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TraderListingsForFarmers;