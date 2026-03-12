import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, CheckCircle, FileSpreadsheet, ArrowLeft, PlusCircle, LayoutList, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

const PriceDataUpload = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // States for Bulk Upload
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Single Upload
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState('');
  const [formData, setFormData] = useState({
    crop_name: '', variety: '', market_name: '', min_price: '', max_price: '', modal_price: ''
  });

  // ==========================================
  // CLEAR ALL PRICES LOGIC
  // ==========================================
  const handleClearPrices = async () => {
    if (!window.confirm("🚨 WARNING: This will instantly delete ALL market prices from the database! Are you absolutely sure?")) return;
    
    setLoading(true);
    setSuccessMsg('');
    setSingleSuccess('');
    
    try {
      await api.clearAllPrices();
      alert('All market prices have been successfully cleared!');
    } catch (error: any) {
      alert("Failed to clear prices: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BULK UPLOAD LOGIC
  // ==========================================
  const handleDownloadTemplate = () => {
    const headers = "Crop Name,Variety,Market Name,Min Price,Max Price,Modal Price\n";
    const sampleData = "Wheat,Sharbati,Bhopal Mandi,2100,2400,2250\nTomato,Desi,Kolar Market,1500,2000,1800";
    const csvContent = "data:text/csv;charset=utf-8," + headers + sampleData;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "krishisethu_price_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return alert('Please upload a valid CSV file.');
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.uploadCSVPrices(formData);
      setSuccessMsg(response.message || 'CSV streamed and uploaded successfully!');
    } catch (error: any) {
      alert("Upload Failed: " + error.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // SINGLE UPLOAD LOGIC
  // ==========================================
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleSuccess('');

    try {
      const payload = [{
        crop_name: formData.crop_name,
        variety: formData.variety || 'Standard',
        market_name: formData.market_name,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
        modal_price: parseFloat(formData.modal_price)
      }];

      await api.uploadBulkPrices(payload);
      setSingleSuccess(`${formData.crop_name} price added successfully!`);
      setFormData({ crop_name: '', variety: '', market_name: '', min_price: '', max_price: '', modal_price: '' }); // Reset form
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Update Market Prices</h1>
            <p className="text-gray-500 text-sm">Add live mandi rates for farmers and traders</p>
          </div>
        </div>
        
        {/* NEW CLEAR ALL BUTTON */}
        <button 
          onClick={handleClearPrices}
          disabled={loading || singleLoading}
          className="flex items-center justify-center py-2 px-4 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold transition-colors"
        >
          <Trash2 size={18} className="mr-2" /> Clear All Old Prices
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <button 
          onClick={() => setActiveTab('single')} 
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'single' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <PlusCircle size={18} className="mr-2" /> Add Individual Price
        </button>
        <button 
          onClick={() => setActiveTab('bulk')} 
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'bulk' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <LayoutList size={18} className="mr-2" /> Bulk CSV Upload
        </button>
      </div>

      {/* ==================== SINGLE FORM VIEW ==================== */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
                <input required type="text" placeholder="e.g., Wheat" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                <input type="text" placeholder="e.g., Sharbati" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Market (Mandi) Name *</label>
                <input required type="text" placeholder="e.g., Bhopal Mandi" value={formData.market_name} onChange={e => setFormData({...formData, market_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹) *</label>
                <input required type="number" min="0" placeholder="0" value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹) *</label>
                <input required type="number" min="0" placeholder="0" value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Modal Price (Average) (₹) *</label>
                <input required type="number" min="0" placeholder="0" value={formData.modal_price} onChange={e => setFormData({...formData, modal_price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <button type="submit" disabled={singleLoading} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition flex justify-center items-center">
              {singleLoading ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle size={20} className="mr-2" />}
              {singleLoading ? 'Publishing...' : 'Publish Live Price'}
            </button>

            {singleSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800 text-sm font-medium">
                <CheckCircle size={18} className="mr-2" /> {singleSuccess}
              </div>
            )}
          </form>
        </div>
      )}

      {/* ==================== BULK CSV VIEW ==================== */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Download the CSV template below.</li>
              <li>Fill in today's market rates for various crops.</li>
              <li>Save the file as a CSV and upload it here.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-center py-3 border-2 border-green-600 text-green-700 rounded-xl font-bold hover:bg-green-50 transition">
              <Download size={20} className="mr-2" /> Download CSV Template
            </button>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition">
              <FileSpreadsheet size={40} className="mx-auto text-indigo-400 mb-3" />
              <p className="text-gray-700 font-medium mb-4">Drag and drop or choose your completed CSV</p>
              
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload size={18} className="mr-2" />}
                {loading ? 'Processing Data...' : 'Choose CSV File'}
              </label>
            </div>
          </div>

          {successMsg && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <p className="font-medium text-green-800">{successMsg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceDataUpload; 