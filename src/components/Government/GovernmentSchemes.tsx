import React, { useState } from 'react';
import { Search, ExternalLink, Award, DollarSign, Shield, BookOpen } from 'lucide-react';
import { GovernmentScheme } from '../../types';

interface GovernmentSchemesProps {
  schemes: GovernmentScheme[];
}

const GovernmentSchemes: React.FC<GovernmentSchemesProps> = ({ schemes }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { key: 'all', label: 'सभी', labelEn: 'All', icon: Award },
    { key: 'subsidy', label: 'सब्सिडी', labelEn: 'Subsidy', icon: DollarSign },
    { key: 'loan', label: 'ऋण', labelEn: 'Loan', icon: DollarSign },
    { key: 'insurance', label: 'बीमा', labelEn: 'Insurance', icon: Shield },
    { key: 'training', label: 'प्रशिक्षण', labelEn: 'Training', icon: BookOpen },
  ];

  const filteredSchemes = schemes.filter(scheme => {
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    if (!cat) return Award;
    return cat.icon;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      subsidy: 'bg-green-100 text-green-800 border-green-200',
      loan: 'bg-blue-100 text-blue-800 border-blue-200',
      insurance: 'bg-purple-100 text-purple-800 border-purple-200',
      training: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">सरकारी योजनाएं</h2>
        <p className="text-sm text-gray-600">Government Schemes</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="योजना खोजें / Search schemes"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              <span>{category.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Schemes List */}
      <div className="space-y-4">
        {filteredSchemes.map((scheme) => {
          const IconComponent = getCategoryIcon(scheme.category);
          return (
            <div key={scheme.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <img 
                src={scheme.image} 
                alt={scheme.title}
                className="w-full h-32 object-cover"
              />
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{scheme.title}</h3>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(scheme.category)}`}>
                      <IconComponent size={12} />
                      <span className="capitalize">{scheme.category}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">पात्रता / Eligibility:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {scheme.eligibility.map((criteria, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">लाभ / Benefits:</h4>
                    <p className="text-sm text-gray-600">{scheme.benefits}</p>
                  </div>

                  <button
                    onClick={() => window.open(scheme.applicationLink, '_blank')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>आवेदन करें / Apply Now</span>
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="text-center py-8">
          <Award size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">कोई योजना नहीं मिली</p>
          <p className="text-sm text-gray-400">No schemes found</p>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;