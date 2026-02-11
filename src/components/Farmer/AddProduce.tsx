import React, { useState } from 'react';
import { Camera, MapPin, Calendar, Package } from 'lucide-react';

interface AddProduceProps {
  onSubmit: (produceData: any) => void;
}

const AddProduce: React.FC<AddProduceProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    quantity: '',
    unit: 'kg',
    basePrice: '',
    description: '',
    harvestDate: '',
    location: '',
    images: [] as string[]
  });

  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const crops = [
    'गेहूं (Wheat)', 'धान (Rice)', 'मक्का (Maize)', 'बाजरा (Pearl Millet)',
    'सरसों (Mustard)', 'चना (Chickpea)', 'अरहर (Pigeon Pea)', 'मसूर (Lentil)',
    'आलू (Potato)', 'प्याज (Onion)', 'टमाटर (Tomato)', 'मिर्च (Chili)'
  ];

  const units = [
    { value: 'kg', label: 'किलोग्राम (Kg)' },
    { value: 'quintal', label: 'क्विंटल (Quintal)' },
    { value: 'ton', label: 'टन (Ton)' }
  ];

  const handleImageCapture = () => {
    // Simulate image capture
    const dummyImages = [
      'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg',
      'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg'
    ];
    setImagePreview(dummyImages);
    setFormData({ ...formData, images: dummyImages });
  };

  const detectLocation = () => {
    // Simulate location detection
    setFormData({ ...formData, location: 'Khadakwasla, Pune, Maharashtra' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
      basePrice: parseFloat(formData.basePrice),
      status: 'active',
      bids: []
    });
    
    // Reset form
    setFormData({
      name: '',
      variety: '',
      quantity: '',
      unit: 'kg',
      basePrice: '',
      description: '',
      harvestDate: '',
      location: '',
      images: []
    });
    setImagePreview([]);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">फसल बेचें</h2>
        <p className="text-sm text-gray-600">Sell Your Produce</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Crop Selection */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            फसल का नाम / Crop Name *
          </label>
          <select
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">फसल चुनें / Select Crop</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        {/* Variety and Quantity */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              किस्म / Variety
            </label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="जैसे: HD-2967, PB-1509"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              मात्रा / Quantity *
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {units.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Base Price */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            न्यूनतम कीमत / Minimum Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">₹</span>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">प्रति {formData.unit} की कीमत</p>
        </div>

        {/* Images */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            फसल की तस्वीर / Crop Images
          </label>
          
          <button
            type="button"
            onClick={handleImageCapture}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 transition-colors"
          >
            <Camera size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">तस्वीर लें / Take Photo</p>
          </button>
          
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {imagePreview.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            स्थान / Location *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="गांव, तहसील, जिला"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={detectLocation}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MapPin size={20} />
            </button>
          </div>
        </div>

        {/* Harvest Date */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            कटाई की तारीख / Harvest Date
          </label>
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              value={formData.harvestDate}
              onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            विवरण / Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="फसल की गुणवत्ता, विशेषताएं आदि के बारे में बताएं"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
        >
          फसल सूची में जोड़ें / Add to Listings
        </button>
      </form>
    </div>
  );
};

export default AddProduce;