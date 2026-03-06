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
    location: ''
  });

  // State for actual file uploads and their local previews
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comprehensive crop list with categories
  const crops = [
    { value: 'Wheat', label: '🌾 Wheat', category: 'grain' },
    { value: 'Rice', label: '🌾 Rice', category: 'grain' },
    { value: 'Maize', label: '🌽 Maize', category: 'grain' },
    { value: 'Mustard', label: '🌻 Mustard', category: 'oilseed' },
    { value: 'Sunflower', label: '🌻 Sunflower', category: 'oilseed' },
    { value: 'Chickpea', label: '🫘 Chickpea', category: 'pulse' },
    { value: 'Potato', label: '🥔 Potato', category: 'vegetable' },
    { value: 'Onion', label: '🧅 Onion', category: 'vegetable' },
    { value: 'Tomato', label: '🍅 Tomato', category: 'vegetable' },
    { value: 'Mango', label: '🥭 Mango', category: 'fruit' },
    { value: 'Banana', label: '🍌 Banana', category: 'fruit' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogram (Kg)', icon: '⚖️' },
    { value: 'quintal', label: 'Quintal', icon: '📦' },
    { value: 'ton', label: 'Ton', icon: '🚛' }
  ];

  // Handle local file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const availableSlots = 5 - imageFiles.length;
      const allowedFiles = filesArray.slice(0, availableSlots);

      if (allowedFiles.length > 0) {
        setImageFiles(prev => [...prev, ...allowedFiles]);

        // Generate temporary local URLs for preview
        const newPreviews = allowedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      const locations = ['Khadakwasla, Pune', 'Baramati, Pune', 'Nashik', 'Aurangabad'];
      setFormData({ ...formData, location: locations[Math.floor(Math.random() * locations.length)] });
      setIsDetectingLocation(false);
    }, 2000);
  };

  // 👇 REWRITTEN FOR DIRECT SUPABASE UPLOAD 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.quantity || !formData.expectedPrice || !formData.location) {
      setError('कृपया सभी आवश्यक फ़ील्ड भरें / Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. First insert the crop listing to get an ID
      const { data: listingData, error: listingError } = await supabase
        .from('crop_listings')
        .insert([{
          farmer_id: farmerId,
          variety: formData.variety ? formData.variety : formData.name, // Use variety if provided, else crop name
          quantity: formData.quantity,
          unit: formData.unit,
          current_price: Number(formData.expectedPrice),
          location: formData.location,
          status: 'active' // Ensure it's active so it shows up
        }])
        .select()
        .single();

      if (listingError) throw listingError;

      const listingId = listingData.id;
      const uploadedImageUrls: string[] = [];

      // 2. Upload images to Supabase Storage if any exist
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${farmerId}/${listingId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('crop_pictures') // FIXED THE BUCKET NAME HERE
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get the public URL for the image
          const { data: publicUrlData } = supabase.storage
            .from('crop_pictures') // FIXED THE BUCKET NAME HERE
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrlData.publicUrl);
        }

        // 3. Insert into crop_pictures table linking to the new listing
        const pictureInserts = uploadedImageUrls.map(url => ({
          listing_id: listingId,
          image_url: url
        }));

        const { error: picError } = await supabase
          .from('crop_pictures')
          .insert(pictureInserts);

        if (picError) throw picError;
      }

      alert('Produce and images uploaded successfully!');
      onSubmit(listingData); // Pass the result up
      onBack(); // Return to dashboard

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Error uploading produce. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // 👆 END SUPABASE REWRITE

  const isFormValid = () => {
    return formData.name && formData.quantity && formData.expectedPrice && formData.location;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button type="button" title="Go back" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">फसल बेचें</h1>
            <p className="text-sm text-gray-600">Add Produce to Sell</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">

        {/* --- CROP NAME DROPDOWN --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">फसल का नाम / Crop Name *</label>
          <select
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">फसल चुनें / Select Crop</option>
            {crops.map((crop) => (
              <option key={crop.value} value={crop.value}>{crop.label}</option>
            ))}
          </select>
        </div>

        {/* --- VARIETY & QUANTITY --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">किस्म / Variety</label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="e.g: Basmati"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">मात्रा / Quantity *</label>
            <div className="flex space-x-3">
              <input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required min="0.1" step="0.1"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {units.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* --- EXPECTED PRICE --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">अपेक्षित कीमत / Expected Price *</label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-500 text-lg">₹</span>
            <input
              type="number"
              value={formData.expectedPrice}
              onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
              placeholder="0"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required min="1" step="1"
            />
          </div>
        </div>

        {/* --- ACTUAL FILE UPLOAD SECTION --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">फसल की तस्वीरें / Produce Images</label>

          <div className="space-y-4">
            <label className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 transition-colors group cursor-pointer block">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={imageFiles.length >= 5}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <Upload size={24} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">तस्वीर अपलोड करें / Select Files</p>
                <p className="text-xs text-gray-500">Maximum 5 images allowed</p>
              </div>
            </label>

            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Selected Images ({imagePreviews.length}/5)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {imagePreviews.map((img, index) => (
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

        {/* --- LOCATION --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">स्थान / Location *</label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="गांव, तहसील, जिला"
              className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className={`px-6 py-4 rounded-lg font-medium transition-colors ${isDetectingLocation ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {isDetectingLocation ? 'खोज रहे हैं...' : 'स्थान खोजें'}
            </button>
          </div>
        </div>

        {/* --- DESCRIPTION --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">विवरण / Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="फसल की गुणवत्ता, विशेषताएं..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-24 resize-none"
          />
        </div>

        {/* Error State */}
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
            className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${isFormValid() && !isSubmitting
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading to server...</span>
              </div>
            ) : isFormValid() ? (
              <div className="flex items-center justify-center space-x-2">
                <Check size={20} />
                <span>फसल सूची में जोड़ें / List Produce</span>
              </div>
            ) : (
              'कृपया सभी आवश्यक फ़ील्ड भरें'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedAddProduce;
