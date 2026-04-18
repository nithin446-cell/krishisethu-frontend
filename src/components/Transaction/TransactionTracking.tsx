import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  CreditCard, 
  Package,
  MapPin,
  Phone,
  ArrowLeft,
  HandHeart,
  Banknote,
  Shield,
  AlertCircle,
  Download,
  Share2,
  Star,
  User,
  Calendar,
  IndianRupee as Rupee
} from 'lucide-react';
import { Transaction } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface TransactionTrackingProps {
  transaction: Transaction;
  onBack: () => void;
  onContactSupport: () => void;
}

const TransactionTracking: React.FC<TransactionTrackingProps> = ({
  transaction,
  onBack,
  onContactSupport
}) => {
  const { t } = useLanguage();
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'payment_completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'payment_initiated': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'produce_collected': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'deal_accepted': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'confirmed': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'in_transit': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('transaction.pending');
      case 'deal_accepted': return t('transaction.dealAccepted');
      case 'produce_collected': return t('transaction.produceCollected');
      case 'payment_initiated': return t('transaction.paymentInitiated');
      case 'payment_completed': return t('transaction.paymentCompleted');
      case 'completed': return t('transaction.completed');
      default: return status;
    }
  };

  // Enhanced timeline with payment tracking
  const paymentTimelineSteps = [
    {
      id: 'deal_accepted',
      title: t('transaction.dealAccepted'),
      description: t('chat.interested'),
      icon: HandHeart,
      completed: true,
      timestamp: '2024-01-15 10:30 AM',
      details: [
        `${t('bidding.bidAmount')}: ₹115,000`,
        `${t('addProduce.quantity')}: 50 क्विंटल`,
        `${t('addProduce.cropName')}: गेहूं (HD-2967)`
      ]
    },
    {
      id: 'produce_collected',
      title: t('transaction.produceCollected'),
      description: t('transaction.produceCollected'),
      icon: Package,
      completed: ['produce_collected', 'payment_initiated', 'payment_completed', 'completed'].includes(transaction.status),
      timestamp: transaction.status !== 'deal_accepted' ? '2024-01-15 02:00 PM' : '',
      details: [
        `${t('transaction.qualityCheck')}: PASS`,
        `${t('transaction.weightVerified')}: 50 Qtl`,
        `${t('transaction.collection')}: Pune`
      ]
    },
    {
      id: 'payment_initiated',
      title: t('transaction.paymentInitiated'),
      description: t('transaction.paymentInitiated'),
      icon: CreditCard,
      completed: ['payment_initiated', 'payment_completed', 'completed'].includes(transaction.status),
      timestamp: ['payment_initiated', 'payment_completed', 'completed'].includes(transaction.status) ? '2024-01-15 04:30 PM' : '',
      details: [
        `${t('transaction.platformFee')}: 5%`,
        `${t('transaction.method')}: ${t('transaction.bankTransfer')}`
      ]
    },
    {
      id: 'payment_completed',
      title: t('transaction.paymentCompleted'),
      description: t('transaction.paymentCompleted'),
      icon: Banknote,
      completed: ['payment_completed', 'completed'].includes(transaction.status),
      timestamp: ['payment_completed', 'completed'].includes(transaction.status) ? '2024-01-15 05:15 PM' : '',
      details: [
        `${t('transaction.utrNumber')}: 123456789012`,
        `${t('transaction.farmerAccount')}: ****1234`,
        `${t('transaction.paymentStatus')}: ${t('transaction.success')}`
      ]
    }
  ];

  const currentStepIndex = paymentTimelineSteps.findIndex(step => 
    step.id === transaction.status || 
    (transaction.status === 'completed' && step.id === 'payment_completed')
  );

  const paymentBreakdown = {
    produceValue: transaction.amount * 0.95,
    platformFee: transaction.amount * 0.03,
    transportCost: transaction.amount * 0.02,
    total: transaction.amount
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
            <h1 className="text-lg font-semibold text-gray-800">{t('transaction.title')}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
              <Share2 size={20} className="text-blue-600" />
            </button>
            <button
              onClick={onContactSupport}
              className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
            >
              <Phone size={20} className="text-green-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Transaction Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Transaction #{transaction.id.slice(0, 8)}</h3>
              <p className="text-blue-100 text-sm">{t('transaction.orderId')}: {transaction.id}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)} bg-white`}>
              {getStatusText(transaction.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500 bg-opacity-50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Rupee size={20} />
                <p className="text-sm text-blue-100">{t('transaction.amount')}</p>
              </div>
              <p className="text-2xl font-bold">₹{transaction.amount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-500 bg-opacity-50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Package size={20} />
                <p className="text-sm text-blue-100">{t('transaction.quantity')}</p>
              </div>
              <p className="text-2xl font-bold">{transaction.quantity} kg</p>
            </div>
          </div>
        </div>

        {/* Deal Confirmation Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{t('transaction.dealConfirmation')}</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('transaction.produce')}</p>
                <p className="font-semibold text-gray-800">Wheat (HD-2967)</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('transaction.rate')}</p>
                <p className="font-semibold text-gray-800">₹2,300 {t('transaction.perQuintal')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('transaction.farmer')}</p>
                <p className="font-semibold text-gray-800">Ram Kumar</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('transaction.location')}</p>
                <p className="font-semibold text-gray-800">Khadakwasla, Pune</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">{t('transaction.qualityGuarantee')}</span>
              </div>
              <p className="text-sm text-green-700">
                {t('transaction.qualityGuaranteeDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Status Timeline */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{t('transaction.status')}</h4>
              <p className="text-sm text-gray-600">{t('transaction.trackProgress')}</p>
            </div>
            <button
              onClick={() => setShowPaymentDetails(!showPaymentDetails)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              {showPaymentDetails ? t('transaction.hideDetails') : t('transaction.viewDetails')}
            </button>
          </div>
          
          <div className="space-y-6">
            {paymentTimelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === paymentTimelineSteps.length - 1;
              const isActive = index === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      step.completed 
                        ? 'bg-green-600 text-white border-green-600' 
                        : isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    }`}>
                      <Icon size={20} />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-12 mt-2 ${
                        step.completed ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className={`font-semibold ${
                          step.completed ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h5>
                      </div>
                      {step.timestamp && (
                        <div className="text-right">
                          <span className="text-xs text-gray-500">{step.timestamp}</span>
                          {step.completed && (
                            <div className="flex items-center space-x-1 mt-1">
                              <CheckCircle size={12} className="text-green-600" />
                              <span className="text-xs text-green-600 font-medium">{t('transaction.completed')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      step.completed ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.details && step.completed && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="space-y-1">
                          {step.details.map((detail, idx) => (
                            <p key={idx} className="text-xs text-gray-600">• {detail}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Banknote size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{t('transaction.paymentBreakdown')}</h4>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('transaction.produceValue')} (50 {t('transaction.quintal')} × ₹2,300):</span>
              <span className="font-medium">₹1,15,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('transaction.platformFee')} (5%):</span>
              <span className="font-medium text-red-600">- ₹5,750</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('farmer.amount')}:</span>
              <span className="font-medium text-green-600">₹1,09,250</span>
            </div>
            <div className="flex justify-between items-center py-2 font-semibold text-lg">
              <span className="text-gray-800">{t('transaction.totalAmount')}:</span>
              <span className="text-blue-600">₹1,15,000</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {t('transaction.securePayment')}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              {t('transaction.securePaymentDesc')}
            </p>
          </div>
        </div>

        {showPaymentDetails && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t('transaction.paymentBreakdown')}</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('transaction.produceValue')}:</span>
                <span className="font-medium">₹{paymentBreakdown.produceValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('transaction.platformFee')} (3%):</span>
                <span className="font-medium">₹{paymentBreakdown.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('transaction.transportCost')} (2%):</span>
                <span className="font-medium">₹{paymentBreakdown.transportCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 font-semibold text-lg border-t-2 border-gray-200">
                <span className="text-gray-800">{t('transaction.totalAmount')}:</span>
                <span className="text-green-600">₹{paymentBreakdown.total.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {t('transaction.securePayment')}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                {t('transaction.securePaymentDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Delivery Information */}
        {['in_transit', 'delivered', 'completed'].includes(transaction.status) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">{t('transaction.deliveryInfo')}</h4>
              <button
                onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
                className="text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                {showDeliveryDetails ? t('transaction.hide') : t('transaction.track')}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <MapPin size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">{t('transaction.pickupLocation')}</p>
                  <p className="text-sm text-blue-700">Khadakwasla, Pune, Maharashtra</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Truck size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{t('transaction.vehicleDetails')}</p>
                  <p className="text-sm text-green-700">MH 12 AB 1234 - Tata 407</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <User size={20} className="text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">{t('transaction.driverContact')}</p>
                  <p className="text-sm text-orange-700">Ramesh Kumar - +91 98765 43210</p>
                </div>
              </div>

              {showDeliveryDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">{t('transaction.liveTracking')}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('transaction.currentLocation')}:</span>
                      <span className="text-sm font-medium">Pune-Mumbai Highway, KM 45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('transaction.estimatedArrival')}:</span>
                      <span className="text-sm font-medium">2 {t('transaction.hours')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">65% {t('transaction.journeyComplete')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Documents */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">{t('transaction.receipt')}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={20} className="text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">{t('transaction.invoice')}</p>
                <p className="text-xs text-gray-500">PDF - 245 KB</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={20} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">{t('transaction.qualityCertificate')}</p>
                <p className="text-xs text-gray-500">PDF - 180 KB</p>
              </div>
            </button>
          </div>
        </div>

        {/* Rate Transaction */}
        {transaction.status === 'completed' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t('transaction.rateTransaction')}</h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('transaction.rateFarmer')}:</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="p-1">
                      <Star size={24} className="text-yellow-400 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">{t('transaction.feedback')}:</label>
                <textarea
                  placeholder={t('transaction.shareExperience')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                />
              </div>
              
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                {t('transaction.submitRating')}
              </button>
            </div>
          </div>
        )}

        {/* Collection Information */}
        {['produce_collected', 'payment_initiated', 'payment_completed', 'completed'].includes(transaction.status) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck size={24} className="text-orange-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{t('transaction.collectionInfo')}</h4>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <MapPin size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">{t('transaction.pickupLocation')}</p>
                  <p className="text-sm text-blue-700">खडकवासला, पुणे, महाराष्ट्र</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Package size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{t('transaction.qualityStatus')}</p>
                  <p className="text-sm text-green-700">{t('transaction.checkComplete')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Phone size={20} className="text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">{t('transaction.farmerContact')}</p>
                  <p className="text-sm text-orange-700">राम कुमार - +91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-800">{t('transaction.needHelp')}</p>
              <p className="text-sm text-yellow-700">24/7 Support</p>
            </div>
            <button
              onClick={onContactSupport}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              {t('transaction.supportCenter')}
            </button>
          </div>
        </div>

        {/* Transaction Receipt */}
        {['payment_completed', 'completed'].includes(transaction.status) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">{t('transaction.receipt')}</h4>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  const receiptHtml = `
                    <html>
                      <head>
                        <title>Receipt - Transaction #${transaction.id.slice(0, 8)}</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                          .btn { padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; margin-left: 10px; }
                          .btn-primary { background: #16a34a; color: white; }
                          .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
                          .action-bar { display: flex; justify-content: flex-end; margin-bottom: 20px; }
                          @media print { .action-bar { display: none; } body { padding: 0; } }
                        </style>
                      </head>
                      <body>
                        <div class="action-bar">
                          <button class="btn btn-secondary" onclick="window.close()">Close</button>
                          <button class="btn btn-primary" onclick="window.print()">Print / Download PDF</button>
                        </div>
                        <h2>Transaction Receipt</h2>
                        <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                        <p><strong>Amount:</strong> ₹${transaction.amount.toLocaleString()}</p>
                        <p><strong>Quantity:</strong> ${transaction.quantity} kg</p>
                        <p><strong>Status:</strong> ${transaction.status.replace('_', ' ').toUpperCase()}</p>
                      </body>
                    </html>
                  `;
                  printWindow.document.write(receiptHtml);
                  printWindow.document.close();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {t('transaction.download')}
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">UTR Number:</span>
                <span className="font-mono">123456789012</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date:</span>
                <span>15 जनवरी 2024, 5:15 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('transaction.status')}:</span>
                <span className="text-green-600 font-medium">Successful</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTracking;