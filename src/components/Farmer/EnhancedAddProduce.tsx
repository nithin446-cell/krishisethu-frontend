import React, { useState } from 'react';
import { Camera, MapPin, Calendar, Package, ArrowLeft, Check, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EnhancedAddProduceProps {
  onSubmit: (produceData: any) => void;
  onBack: () => void;
  farmerId: string;
}

const EnhancedAddProduce: React.FC<EnhancedAddProduceProps> = ({ onSubmit, onBack, farmerId }) => {
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    quantity: 0,
    unit: 'quintal' as 'kg' | 'quintal' | 'ton',
    expectedPrice: '',
    description: '',
    harvestDate: '',
    location: '',
    images: [] as string[]
  });

  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comprehensive crop list with categories
  const crops = [
    { value: 'Wheat', label: '🌾 Wheat', category: 'grain' },
    { value: 'Rice', label: '🌾 Rice', category: 'grain' },
    { value: 'Maize', label: '🌽 Maize', category: 'grain' },
    { value: 'Pearl Millet', label: '🌾 Pearl Millet', category: 'grain' },
    { value: 'Sorghum', label: '🌾 Sorghum', category: 'grain' },
    { value: 'Barley', label: '🌾 Barley', category: 'grain' },
    { value: 'Mustard', label: '🌻 Mustard', category: 'oilseed' },
    { value: 'Sunflower', label: '🌻 Sunflower', category: 'oilseed' },
    { value: 'Sesame', label: '🌱 Sesame', category: 'oilseed' },
    { value: 'Chickpea', label: '🫘 Chickpea', category: 'pulse' },
    { value: 'Pigeon Pea', label: '🫘 Pigeon Pea', category: 'pulse' },
    { value: 'Lentil', label: '🫘 Lentil', category: 'pulse' },
    { value: 'Kidney Bean', label: '🫘 Kidney Bean', category: 'pulse' },
    { value: 'Potato', label: '🥔 Potato', category: 'vegetable' },
    { value: 'Onion', label: '🧅 Onion', category: 'vegetable' },
    { value: 'Tomato', label: '🍅 Tomato', category: 'vegetable' },
    { value: 'Chili', label: '🌶️ Chili', category: 'vegetable' },
    { value: 'Brinjal', label: '🍆 Brinjal', category: 'vegetable' },
    { value: 'Okra', label: '🥒 Okra', category: 'vegetable' },
    { value: 'Cauliflower', label: '🥬 Cauliflower', category: 'vegetable' },
    { value: 'Cabbage', label: '🥬 Cabbage', category: 'vegetable' },
    { value: 'Carrot', label: '🥕 Carrot', category: 'vegetable' },
    { value: 'Radish', label: '🥕 Radish', category: 'vegetable' },
    { value: 'Cucumber', label: '🥒 Cucumber', category: 'vegetable' },
    { value: 'Bottle Gourd', label: '🥒 Bottle Gourd', category: 'vegetable' },
    { value: 'Pumpkin', label: '🎃 Pumpkin', category: 'vegetable' },
    { value: 'Mango', label: '🥭 Mango', category: 'fruit' },
    { value: 'Banana', label: '🍌 Banana', category: 'fruit' },
    { value: 'Grapes', label: '🍇 Grapes', category: 'fruit' },
    { value: 'Orange', label: '🍊 Orange', category: 'fruit' },
    { value: 'Lemon', label: '🍋 Lemon', category: 'fruit' },
    { value: 'Pomegranate', label: '🍎 Pomegranate', category: 'fruit' },
    { value: 'Papaya', label: '🥭 Papaya', category: 'fruit' },
    { value: 'Guava', label: '🍐 Guava', category: 'fruit' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogram (Kg)', icon: '⚖️' },
    { value: 'quintal', label: 'Quintal', icon: '📦' },
    { value: 'ton', label: 'Ton', icon: '🚛' }
  ];

  const handleImageUpload = () => {
    // Simulate image upload with multiple sample images
    const sampleImages = [
      'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg',
      'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
      'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg'
    ];
    
    // Add new images to existing ones (max 5 images)
    const newImages = [...imagePreview];
    sampleImages.forEach(img => {
      if (newImages.length < 5 && !newImages.includes(img)) {
        newImages.push(img);
      }
    });
    
    setImagePreview(newImages);
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newImages);
    setFormData({ ...formData, images: newImages });
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    
    // Simulate location detection with a delay
    setTimeout(() => {
      const locations = [
        'Khadakwasla, Pune, Maharashtra',
        'Baramati, Pune, Maharashtra',
        'Nashik, Maharashtra',
        'Aurangabad, Maharashtra',
        'Solapur, Maharashtra'
      ];
      
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      setFormData({ ...formData, location: randomLocation });
      setIsDetectingLocation(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.quantity || !formData.expectedPrice || !formData.location) {
      setError('कृपया सभी आवश्यक फ़ील्ड भरें / Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('produces')
        .insert({
          farmer_id: farmerId,
          name: formData.name,
          variety: formData.variety || null,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          base_price: parseFloat(formData.expectedPrice),
          current_price: parseFloat(formData.expectedPrice),
          images: formData.images,
          description: formData.description || null,
          location: formData.location,
          harvest_date: formData.harvestDate || null,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onSubmit(data);
    } catch (err) {
      console.error('Error adding produce:', err);
      setError('फसल जोड़ने में त्रुटि / Error adding produce. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.name && formData.quantity && formData.expectedPrice && formData.location;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">फसल बेचें</h1>
            <p className="text-sm text-gray-600">Add Produce to Sell</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Crop Name Dropdown */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            फसल का नाम / Crop Name *
          </label>
          <select
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">फसल चुनें / Select Crop</option>
            <optgroup label="🌾 अनाज / Grains">
              {crops.filter(crop => crop.category === 'grain').map((crop) => (
                <option key={crop.value} value={crop.value}>{crop.label}</option>
              ))}
            </optgroup>
            <optgroup label="🌻 तिलहन / Oilseeds">
              {crops.filter(crop => crop.category === 'oilseed').map((crop) => (
                <option key={crop.value} value={crop.value}>{crop.label}</option>
              ))}
            </optgroup>
            <optgroup label="🫘 दालें / Pulses">
              {crops.filter(crop => crop.category === 'pulse').map((crop) => (
                <option key={crop.value} value={crop.value}>{crop.label}</option>
              ))}
            </optgroup>
            <optgroup label="🥬 सब्जियां / Vegetables">
              {crops.filter(crop => crop.category === 'vegetable').map((crop) => (
                <option key={crop.value} value={crop.value}>{crop.label}</option>
              ))}
            </optgroup>
            <optgroup label="🍎 फल / Fruits">
              {crops.filter(crop => crop.category === 'fruit').map((crop) => (
                <option key={crop.value} value={crop.value}>{crop.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Variety (Optional) */}
        {formData.name && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              किस्म / Variety (Optional)
            </label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="जैसे: HD-2967, PB-1509, Basmati"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            मात्रा / Quantity *
          </label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="flex-1 p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              min="0.1"
              step="0.1"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'kg' | 'quintal' | 'ton' })}
              className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {units.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.icon} {unit.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-2">उपलब्ध मात्रा दर्ज करें</p>
        </div>

        {/* Expected Price */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            अपेक्षित कीमत / Expected Price *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-500 text-lg">₹</span>
            <input
              type="number"
              value={formData.expectedPrice}
              onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
              placeholder="0"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              min="1"
              step="1"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">प्रति {formData.unit} की कीमत / Price per {formData.unit}</p>
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-1">💡 मूल्य निर्धारण सुझाव</h4>
            <p className="text-sm text-blue-700">
              बाज़ार भाव देखकर प्रतिस्पर्धी कीमत रखें। अच्छी गुणवत्ता के लिए 5-10% अधिक कीमत रख सकते हैं।
            </p>
          </div>
        </div>

        {/* Upload Produce Images */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            फसल की तस्वीरें / Produce Images
          </label>
          
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleImageUpload}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <Upload size={24} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">तस्वीर अपलोड करें / Upload Images</p>
                <p className="text-xs text-gray-500">अच्छी गुणवत्ता की तस्वीरें लें (अधिकतम 5)</p>
              </div>
            </button>
            
            {imagePreview.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  अपलोड की गई तस्वीरें ({imagePreview.length}/5)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {imagePreview.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Auto-detect */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            स्थान / Location *
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="गांव, तहसील, जिला"
              className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className={`px-6 py-4 rounded-lg font-medium transition-colors ${
                isDetectingLocation
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isDetectingLocation ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">खोज रहे हैं...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <MapPin size={20} />
                  <span className="text-sm">स्थान खोजें</span>
                </div>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            स्वचालित स्थान पहचान के लिए "स्थान खोजें" बटन दबाएं
          </p>
        </div>

        {/* Harvest Date (Optional) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            कटाई की तारीख / Harvest Date (Optional)
          </label>
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-4 text-gray-400" />
            <input
              type="date"
              value={formData.harvestDate}
              onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description (Optional) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            विवरण / Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="फसल की गुणवत्ता, विशेषताएं, भंडारण की स्थिति आदि के बारे में बताएं..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-24 resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
              isFormValid() && !isSubmitting
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>जोड़ा जा रहा है... / Adding...</span>
              </div>
            ) : isFormValid() ? (
              <div className="flex items-center justify-center space-x-2">
                <Check size={20} />
                <span>फसल सूची में जोड़ें / Add to Listings</span>
              </div>
            ) : (
              'कृपया सभी आवश्यक फ़ील्ड भरें'
            )}
          </button>

          {!isFormValid() && !isSubmitting && (
            <p className="text-center text-sm text-gray-500 mt-2">
              * चिह्नित फ़ील्ड आवश्यक हैं
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnhancedAddProduce;