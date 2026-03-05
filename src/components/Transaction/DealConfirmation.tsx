import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin, 
  Package,
  IndianRupee as Rupee,
  User,
  Phone,
  Calendar,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Produce, Bid, User as UserType } from '../../types';

interface DealConfirmationProps {
  produce: Produce;
  selectedBid: Bid;
  farmer: UserType;
  trader: UserType;
  onConfirm: () => void;
  onReject: () => void;
  onBack: () => void;
}

const DealConfirmation: React.FC<DealConfirmationProps> = ({
  produce,
  selectedBid,
  farmer,
  trader,
  onConfirm,
  onReject,
  onBack
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');
  const [showTerms, setShowTerms] = useState(false);

  const totalAmount = selectedBid.amount * selectedBid.quantity;
  const platformFee = totalAmount * 0.03;
  const netAmount = totalAmount - platformFee;

  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'बैंक ट्रांसफर / Bank Transfer',
      description: 'Direct bank transfer (Recommended)',
      processingTime: '1-2 business days',
      icon: '🏦'
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Instant payment via UPI',
      processingTime: 'Instant',
      icon: '📱'
    },
    {
      id: 'digital_wallet',
      name: 'डिजिटल वॉलेट / Digital Wallet',
      description: 'Paytm, PhonePe, Google Pay',
      processingTime: 'Instant',
      icon: '💳'
    }
  ];

  const terms = [
    'फसल की गुणवत्ता प्लेटफॉर्म मानकों के अनुसार होनी चाहिए',
    'भुगतान फसल की डिलीवरी और गुणवत्ता सत्यापन के बाद किया जाएगा',
    'यदि फसल की गुणवत्ता अपेक्षा के अनुसार नहीं है तो डील रद्द की जा सकती है',
    'प्लेटफॉर्म शुल्क कुल राशि का 3% होगा',
    'परिवहन की व्यवस्था खरीदार की जिम्मेदारी है',
    'विवाद की स्थिति में प्लेटफॉर्म की मध्यस्थता मान्य होगी'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">डील कन्फर्मेशन</h1>
            <p className="text-sm text-gray-600">Deal Confirmation</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Deal Summary */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">डील स्वीकृत!</h3>
              <p className="text-green-100">Deal Accepted!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500 bg-opacity-50 p-4 rounded-xl">
              <p className="text-sm text-green-100 mb-1">कुल राशि / Total Amount</p>
              <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 bg-opacity-50 p-4 rounded-xl">
              <p className="text-sm text-green-100 mb-1">मात्रा / Quantity</p>
              <p className="text-2xl font-bold">{selectedBid.quantity} {produce.unit}</p>
            </div>
          </div>
        </div>

        {/* Produce Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">फसल विवरण / Produce Details</h4>
          
          <div className="flex space-x-4 mb-4">
            <img 
              src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
              alt={produce.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h5 className="text-lg font-semibold text-gray-800">{produce.name}</h5>
              {produce.variety && <p className="text-sm text-gray-600">{produce.variety}</p>}
              <div className="flex items-center space-x-1 mt-1">
                <MapPin size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">{produce.location}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">दर / Rate</p>
              <p className="font-semibold">₹{selectedBid.amount} per {produce.unit}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">कटाई तिथि / Harvest Date</p>
              <p className="font-semibold">{new Date(produce.harvestDate).toLocaleDateString('hi-IN')}</p>
            </div>
          </div>
        </div>

        {/* Farmer & Trader Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">पार्टी विवरण / Party Details</h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{farmer.name}</p>
                <p className="text-sm text-gray-600">किसान / Farmer</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Phone size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-600">{farmer.phone}</span>
                </div>
              </div>
              {farmer.verified && (
                <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                  <Shield size={12} className="text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Verified</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{trader.name}</p>
                <p className="text-sm text-gray-600">व्यापारी / Trader</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Phone size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-600">{trader.phone}</span>
                </div>
              </div>
              {trader.verified && (
                <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                  <Shield size={12} className="text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">भुगतान विधि / Payment Method</h4>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  selectedPaymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <p className="text-xs text-gray-500">Processing: {method.processingTime}</p>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <CheckCircle size={20} className="text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">भुगतान विवरण / Payment Breakdown</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">फसल मूल्य ({selectedBid.quantity} × ₹{selectedBid.amount}):</span>
              <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">प्लेटफॉर्म शुल्क (3%):</span>
              <span className="font-medium text-red-600">-₹{platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 font-semibold text-lg">
              <span className="text-gray-800">किसान को भुगतान / Net to Farmer:</span>
              <span className="text-green-600">₹{netAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">नियम और शर्तें / Terms & Conditions</h4>
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              {showTerms ? 'छुपाएं' : 'पढ़ें'}
            </button>
          </div>

          {showTerms && (
            <div className="space-y-2 mb-4">
              {terms.map((term, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <p className="text-sm text-gray-700">{term}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              मैं सभी नियम और शर्तों से सहमत हूं / I agree to all terms and conditions
            </label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Shield size={20} className="text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">सुरक्षित लेन-देन / Secure Transaction</p>
              <p className="text-sm text-blue-700">
                आपका भुगतान एस्क्रो में सुरक्षित रहेगा। फसल की डिलीवरी और गुणवत्ता सत्यापन के बाद ही किसान को भुगतान किया जाएगा।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onReject}
            className="py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            रद्द करें / Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={!agreedToTerms}
            className={`py-4 rounded-xl font-medium transition-colors ${
              agreedToTerms
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            डील कन्फर्म करें / Confirm Deal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealConfirmation;