import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, TrendingUp, CheckCircle, AlertTriangle, FileText, Calendar, MapPin, Plus, CreditCard as Edit, Trash2, Save } from 'lucide-react';

interface PriceDataUploadProps {
  onBack: () => void;
}

interface PriceEntry {
  id: string;
  produce: string;
  mandi: string;
  price: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  status: 'draft' | 'published';
}

const PriceDataUpload: React.FC<PriceDataUploadProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'bulk'>('upload');
  const [newPrice, setNewPrice] = useState({
    produce: '',
    mandi: '',
    price: '',
    previousPrice: ''
  });
  const [editingPrice, setEditingPrice] = useState<PriceEntry | null>(null);

  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([
    {
      id: '1',
      produce: 'Wheat',
      mandi: 'Pune APMC',
      price: 2250,
      change: 50,
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      status: 'published'
    },
    {
      id: '2',
      produce: 'Rice',
      mandi: 'Mumbai APMC',
      price: 1900,
      change: -25,
      trend: 'down',
      lastUpdated: new Date().toISOString(),
      status: 'published'
    },
    {
      id: '3',
      produce: 'Maize',
      mandi: 'Delhi APMC',
      price: 1650,
      change: 0,
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
      status: 'draft'
    }
  ]);

  const produces = [
    'Wheat', 'Rice', 'Maize', 'Barley', 'Sorghum',
    'Potato', 'Onion', 'Tomato', 'Chili', 'Brinjal',
    'Mustard', 'Sunflower', 'Sesame', 'Groundnut',
    'Chickpea', 'Pigeon Pea', 'Lentil', 'Kidney Bean'
  ];

  const mandis = [
    'Pune APMC', 'Mumbai APMC', 'Delhi APMC', 'Nashik APMC',
    'Aurangabad APMC', 'Baramati APMC', 'Kolhapur APMC',
    'Solapur APMC', 'Ahmednagar APMC', 'Sangli APMC'
  ];

  const handleAddPrice = () => {
    if (!newPrice.produce || !newPrice.mandi || !newPrice.price) {
      alert('Please fill all required fields');
      return;
    }

    const previousPrice = parseFloat(newPrice.previousPrice) || parseFloat(newPrice.price);
    const currentPrice = parseFloat(newPrice.price);
    const change = currentPrice - previousPrice;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    const priceEntry: PriceEntry = {
      id: Date.now().toString(),
      produce: newPrice.produce,
      mandi: newPrice.mandi,
      price: currentPrice,
      change: change,
      trend: trend,
      lastUpdated: new Date().toISOString(),
      status: 'draft'
    };

    setPriceEntries([priceEntry, ...priceEntries]);
    setNewPrice({ produce: '', mandi: '', price: '', previousPrice: '' });
    alert('Price entry added successfully!');
  };

  const handleEditPrice = (price: PriceEntry) => {
    setEditingPrice(price);
  };

  const handleSaveEdit = () => {
    if (!editingPrice) return;

    setPriceEntries(priceEntries.map(p => 
      p.id === editingPrice.id ? editingPrice : p
    ));
    setEditingPrice(null);
    alert('Price updated successfully!');
  };

  const handleDeletePrice = (id: string) => {
    if (confirm('Are you sure you want to delete this price entry?')) {
      setPriceEntries(priceEntries.filter(p => p.id !== id));
      alert('Price entry deleted successfully!');
    }
  };

  const handlePublishPrice = (id: string) => {
    setPriceEntries(priceEntries.map(p => 
      p.id === id ? { ...p, status: 'published' } : p
    ));
    alert('Price published successfully!');
  };

  const handleBulkUpload = () => {
    alert('Bulk upload feature would open file picker for CSV/Excel files');
  };

  const handleDownloadTemplate = () => {
    alert('Downloading CSV template for bulk price upload');
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">Price Data Management</h1>
          <p className="text-sm text-gray-600">Upload and manage market prices</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-green-600">{priceEntries.filter(p => p.status === 'published').length}</p>
          <p className="text-sm text-gray-600">Published</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-yellow-600">{priceEntries.filter(p => p.status === 'draft').length}</p>
          <p className="text-sm text-gray-600">Draft</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-blue-600">{priceEntries.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📝 Add Price
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manage'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📊 Manage Prices
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'bulk'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          📤 Bulk Upload
        </button>
      </div>

      {/* Add Price Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Price Entry</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produce *
                  </label>
                  <select
                    value={newPrice.produce}
                    onChange={(e) => setNewPrice({ ...newPrice, produce: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Produce</option>
                    {produces.map(produce => (
                      <option key={produce} value={produce}>{produce}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandi *
                  </label>
                  <select
                    value={newPrice.mandi}
                    onChange={(e) => setNewPrice({ ...newPrice, mandi: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Mandi</option>
                    {mandis.map(mandi => (
                      <option key={mandi} value={mandi}>{mandi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price (₹/quintal) *
                  </label>
                  <input
                    type="number"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                    placeholder="2250"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Price (₹/quintal)
                  </label>
                  <input
                    type="number"
                    value={newPrice.previousPrice}
                    onChange={(e) => setNewPrice({ ...newPrice, previousPrice: e.target.value })}
                    placeholder="2200"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use current price</p>
                </div>
              </div>

              <button
                onClick={handleAddPrice}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Price Entry</span>
              </button>
            </div>
          </div>

          {/* Recent Additions */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Additions</h3>
            
            <div className="space-y-3">
              {priceEntries.slice(0, 3).map((price) => (
                <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTrendIcon(price.trend)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{price.produce}</p>
                      <p className="text-sm text-gray-600">{price.mandi}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{price.price}</p>
                    <div className={`text-sm font-medium ${getTrendColor(price.trend)}`}>
                      {price.change > 0 ? '+' : ''}{price.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manage Prices Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {editingPrice && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Price Entry</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹/quintal)</label>
                  <input
                    type="number"
                    value={editingPrice.price}
                    onChange={(e) => setEditingPrice({ ...editingPrice, price: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change</label>
                  <input
                    type="number"
                    value={editingPrice.change}
                    onChange={(e) => setEditingPrice({ ...editingPrice, change: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                  onClick={() => setEditingPrice(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {priceEntries.map((price) => (
              <div key={price.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getTrendIcon(price.trend)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{price.produce}</h3>
                      <p className="text-sm text-gray-600">{price.mandi}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          price.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {price.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(price.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">₹{price.price}</p>
                      <div className={`text-sm font-medium ${getTrendColor(price.trend)}`}>
                        {price.change > 0 ? '+' : ''}{price.change}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPrice(price)}
                        className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </button>
                      
                      {price.status === 'draft' && (
                        <button
                          onClick={() => handlePublishPrice(price.id)}
                          className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle size={16} className="text-green-600" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeletePrice(price.id)}
                        className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bulk Price Upload</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Upload Instructions</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Download the CSV template below</li>
                  <li>• Fill in the price data following the format</li>
                  <li>• Upload the completed CSV file</li>
                  <li>• Review and publish the imported prices</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download size={20} />
                <span>Download CSV Template</span>
              </button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button
                  onClick={handleBulkUpload}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>

          {/* Upload History */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload History</h3>
            
            <div className="space-y-3">
              {[
                { date: '2024-01-20', file: 'price_data_jan20.csv', records: 45, status: 'completed' },
                { date: '2024-01-19', file: 'price_data_jan19.csv', records: 38, status: 'completed' },
                { date: '2024-01-18', file: 'price_data_jan18.csv', records: 52, status: 'failed' }
              ].map((upload, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">{upload.file}</p>
                      <p className="text-sm text-gray-600">{upload.records} records • {upload.date}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    upload.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {upload.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceDataUpload;