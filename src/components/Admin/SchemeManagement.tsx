import React, { useState } from 'react';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, Eye, Upload, FileText, Award, DollarSign, Shield, BookOpen, ExternalLink, Save, X } from 'lucide-react';
import { GovernmentScheme } from '../../types';

interface SchemeManagementProps {
  onBack: () => void;
}

const SchemeManagement: React.FC<SchemeManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');
  const [editingScheme, setEditingScheme] = useState<GovernmentScheme | null>(null);
  const [newScheme, setNewScheme] = useState({
    title: '',
    description: '',
    category: 'subsidy' as 'subsidy' | 'loan' | 'insurance' | 'training',
    eligibility: [''],
    benefits: '',
    applicationLink: '',
    image: ''
  });

  const [schemes, setSchemes] = useState<GovernmentScheme[]>([
    {
      id: '1',
      title: 'PM Kisan Samman Nidhi',
      description: 'A central sector scheme by Government of India that provides income support to small and marginal farmers.',
      category: 'subsidy',
      eligibility: [
        'Cultivable land up to 2 hectares',
        'Must be an Indian citizen',
        'Aadhaar card and bank account required'
      ],
      benefits: '₹6,000 per year in three installments',
      applicationLink: 'https://pmkisan.gov.in',
      image: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
    },
    {
      id: '2',
      title: 'Crop Insurance Scheme',
      description: 'Provides insurance cover to farmers against losses due to natural calamities.',
      category: 'insurance',
      eligibility: [
        'All farmers are eligible',
        'For notified crops only',
        'Application within specified time limit'
      ],
      benefits: 'Insurance amount payment on crop loss',
      applicationLink: 'https://pmfby.gov.in',
      image: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
    },
    {
      id: '3',
      title: 'Kisan Credit Card',
      description: 'Provides farmers with timely access to credit for their cultivation and other needs.',
      category: 'loan',
      eligibility: [
        'All farmers including tenant farmers',
        'Valid land documents required',
        'Good credit history preferred'
      ],
      benefits: 'Credit limit up to ₹3 lakhs at 4% interest',
      applicationLink: 'https://kcc.gov.in',
      image: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
    }
  ]);

  const categories = [
    { key: 'subsidy', label: 'Subsidy', icon: DollarSign, color: 'text-green-600' },
    { key: 'loan', label: 'Loan', icon: DollarSign, color: 'text-blue-600' },
    { key: 'insurance', label: 'Insurance', icon: Shield, color: 'text-purple-600' },
    { key: 'training', label: 'Training', icon: BookOpen, color: 'text-orange-600' }
  ];

  const handleAddEligibility = () => {
    setNewScheme({
      ...newScheme,
      eligibility: [...newScheme.eligibility, '']
    });
  };

  const handleRemoveEligibility = (index: number) => {
    setNewScheme({
      ...newScheme,
      eligibility: newScheme.eligibility.filter((_, i) => i !== index)
    });
  };

  const handleEligibilityChange = (index: number, value: string) => {
    const updatedEligibility = [...newScheme.eligibility];
    updatedEligibility[index] = value;
    setNewScheme({
      ...newScheme,
      eligibility: updatedEligibility
    });
  };

  const handleAddScheme = () => {
    if (!newScheme.title || !newScheme.description || !newScheme.benefits) {
      alert('Please fill all required fields');
      return;
    }

    const scheme: GovernmentScheme = {
      id: Date.now().toString(),
      ...newScheme,
      eligibility: newScheme.eligibility.filter(e => e.trim() !== ''),
      image: newScheme.image || 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
    };

    setSchemes([scheme, ...schemes]);
    setNewScheme({
      title: '',
      description: '',
      category: 'subsidy',
      eligibility: [''],
      benefits: '',
      applicationLink: '',
      image: ''
    });
    setActiveTab('manage');
    alert('Scheme added successfully!');
  };

  const handleEditScheme = (scheme: GovernmentScheme) => {
    setEditingScheme(scheme);
  };

  const handleSaveEdit = () => {
    if (!editingScheme) return;

    setSchemes(schemes.map(s => 
      s.id === editingScheme.id ? editingScheme : s
    ));
    setEditingScheme(null);
    alert('Scheme updated successfully!');
  };

  const handleDeleteScheme = (id: string) => {
    if (confirm('Are you sure you want to delete this scheme?')) {
      setSchemes(schemes.filter(s => s.id !== id));
      alert('Scheme deleted successfully!');
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.icon : Award;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.color : 'text-gray-600';
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">Scheme Management</h1>
          <p className="text-sm text-gray-600">Manage government schemes and programs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category) => {
          const count = schemes.filter(s => s.category === category.key).length;
          const Icon = category.icon;
          return (
            <div key={category.key} className="bg-white p-3 rounded-xl shadow-md text-center">
              <div className={`w-8 h-8 mx-auto mb-2 ${category.color}`}>
                <Icon size={32} />
              </div>
              <p className="text-lg font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-600">{category.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manage'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📋 Manage Schemes
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'add'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          ➕ Add Scheme
        </button>
      </div>

      {/* Manage Schemes Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {editingScheme && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Scheme</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingScheme.title}
                    onChange={(e) => setEditingScheme({ ...editingScheme, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={editingScheme.description}
                    onChange={(e) => setEditingScheme({ ...editingScheme, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Benefits *</label>
                  <textarea
                    value={editingScheme.benefits}
                    onChange={(e) => setEditingScheme({ ...editingScheme, benefits: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-16 resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setEditingScheme(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {schemes.map((scheme) => {
              const Icon = getCategoryIcon(scheme.category);
              return (
                <div key={scheme.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <img 
                    src={scheme.image} 
                    alt={scheme.title}
                    className="w-full h-32 object-cover"
                  />
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{scheme.title}</h3>
                          <div className={`p-1 rounded-full ${getCategoryColor(scheme.category)}`}>
                            <Icon size={16} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{scheme.description}</p>
                        <p className="text-sm font-medium text-green-600">{scheme.benefits}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          scheme.category === 'subsidy' ? 'bg-green-100 text-green-800' :
                          scheme.category === 'loan' ? 'bg-blue-100 text-blue-800' :
                          scheme.category === 'insurance' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {scheme.category}
                        </span>
                        {scheme.applicationLink && (
                          <button
                            onClick={() => window.open(scheme.applicationLink, '_blank')}
                            className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <ExternalLink size={12} className="text-gray-600" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditScheme(scheme)}
                          className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteScheme(scheme.id)}
                          className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Scheme Tab */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Add New Government Scheme</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheme Title *
              </label>
              <input
                type="text"
                value={newScheme.title}
                onChange={(e) => setNewScheme({ ...newScheme, title: e.target.value })}
                placeholder="e.g., PM Kisan Samman Nidhi"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={newScheme.description}
                onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                placeholder="Detailed description of the scheme..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={newScheme.category}
                onChange={(e) => setNewScheme({ ...newScheme, category: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligibility Criteria *
              </label>
              {newScheme.eligibility.map((criteria, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={criteria}
                    onChange={(e) => handleEligibilityChange(index, e.target.value)}
                    placeholder="Enter eligibility criteria..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newScheme.eligibility.length > 1 && (
                    <button
                      onClick={() => handleRemoveEligibility(index)}
                      className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <X size={16} className="text-red-600" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddEligibility}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Another Criteria</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits *
              </label>
              <textarea
                value={newScheme.benefits}
                onChange={(e) => setNewScheme({ ...newScheme, benefits: e.target.value })}
                placeholder="Describe the benefits provided by this scheme..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Link
              </label>
              <input
                type="url"
                value={newScheme.applicationLink}
                onChange={(e) => setNewScheme({ ...newScheme, applicationLink: e.target.value })}
                placeholder="https://example.gov.in"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheme Image URL
              </label>
              <input
                type="url"
                value={newScheme.image}
                onChange={(e) => setNewScheme({ ...newScheme, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default image</p>
            </div>

            <button
              onClick={handleAddScheme}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Scheme</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeManagement;