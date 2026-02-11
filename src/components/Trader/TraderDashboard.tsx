import React, { useState } from 'react';
import { Package, TrendingUp, Clock, CircleCheck as CheckCircle, Bell, Eye, Star, MapPin, IndianRupee as Rupee, ArrowUp, ArrowDown, Activity, CreditCard, Truck, TriangleAlert as AlertTriangle, ListFilter as Filter, Calendar, ChartBar as BarChart3, ShoppingCart, Wallet, FileText, Phone } from 'lucide-react';
import { Produce, Transaction } from '../../types';

interface TraderDashboardProps {
  availableProduce: Produce[];
  myTransactions: Transaction[];
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ availableProduce, myTransactions }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Calculate dashboard metrics
  const activeBids = myTransactions.filter(t => t.status === 'pending' || t.status === 'deal_accepted').length;
  const completedDeals = myTransactions.filter(t => t.status === 'completed').length;
  const totalProduce = availableProduce.length;
  const pendingPayments = myTransactions.filter(t => t.status === 'payment_initiated').length;
  const totalInvestment = myTransactions
    .filter(t => t.status !== 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions based on selected filter
  const filteredTransactions = myTransactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return ['pending', 'deal_accepted'].includes(transaction.status);
    if (selectedFilter === 'payment') return ['payment_initiated', 'payment_completed'].includes(transaction.status);
    if (selectedFilter === 'completed') return transaction.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'payment_completed': return 'bg-green-100 text-green-800';
      case 'payment_initiated': return 'bg-blue-100 text-blue-800';
      case 'deal_accepted': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'बोली लंबित / Bid Pending';
      case 'deal_accepted': return 'सौदा स्वीकार / Deal Accepted';
      case 'payment_initiated': return 'भुगतान प्रक्रिया / Payment Processing';
      case 'payment_completed': return 'भुगतान पूर्ण / Payment Complete';
      case 'completed': return 'पूर्ण / Completed';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'payment_completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'payment_initiated': return <CreditCard size={16} className="text-blue-600" />;
      case 'deal_accepted': return <Package size={16} className="text-purple-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">नमस्ते व्यापारी!</h2>
            <p className="text-blue-100 text-sm">Welcome Trader!</p>
            <p className="text-blue-200 text-xs mt-1">आज के खरीदारी अवसर देखें</p>
          </div>
          <div className="relative">
            <Bell size={24} />
            {(activeBids > 0 || pendingPayments > 0) && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{activeBids + pendingPayments}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalProduce}</p>
              <p className="text-sm text-gray-600 font-medium">उपलब्ध फसलें</p>
              <p className="text-xs text-gray-500">Available Produce</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{activeBids}</p>
              <p className="text-sm text-gray-600 font-medium">सक्रिय बोलियां</p>
              <p className="text-xs text-gray-500">Active Bids</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Wallet size={24} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">निवेश सारांश</h3>
            <p className="text-sm text-gray-600">Investment Summary</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">कुल निवेश / Total Investment</p>
            <p className="text-xl font-bold text-green-800">₹{totalInvestment.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">पूर्ण सौदे / Completed Deals</p>
            <p className="text-xl font-bold text-blue-800">{completedDeals}</p>
          </div>
        </div>
      </div>

      {/* Purchase Tracking Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">खरीदारी ट्रैकिंग</h3>
              <p className="text-sm text-gray-600">Purchase Tracking</p>
            </div>
            <button
              onClick={() => setShowPaymentDetails(!showPaymentDetails)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              {showPaymentDetails ? 'छुपाएं' : 'विवरण देखें'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'सभी', labelEn: 'All', icon: '📊' },
              { key: 'pending', label: 'लंबित', labelEn: 'Pending', icon: '⏳' },
              { key: 'payment', label: 'भुगतान', labelEn: 'Payment', icon: '💳' },
              { key: 'completed', label: 'पूर्ण', labelEn: 'Completed', icon: '✅' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">कोई लेन-देन नहीं</p>
              <p className="text-sm text-gray-400">No transactions in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Transaction #{transaction.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">₹{transaction.amount.toLocaleString()} - {transaction.quantity} क्विंटल</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>बोली / Bid</span>
                      <span>भुगतान / Payment</span>
                      <span>पूर्ण / Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          transaction.status === 'completed' ? 'bg-green-600' :
                          ['payment_initiated', 'payment_completed'].includes(transaction.status) ? 'bg-blue-600' :
                          transaction.status === 'deal_accepted' ? 'bg-purple-600' :
                          'bg-yellow-600'
                        }`}
                        style={{ 
                          width: transaction.status === 'completed' ? '100%' :
                                 ['payment_initiated', 'payment_completed'].includes(transaction.status) ? '75%' :
                                 transaction.status === 'deal_accepted' ? '50%' : '25%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Details */}
                  {showPaymentDetails && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">फसल मूल्य:</span>
                        <span className="font-medium">₹{(transaction.amount * 0.97).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">प्लेटफॉर्म शुल्क:</span>
                        <span className="font-medium">₹{(transaction.amount * 0.03).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-2">
                        <span>कुल भुगतान:</span>
                        <span>₹{transaction.amount.toLocaleString()}</span>
                      </div>
                      
                      {transaction.paymentMethod && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">भुगतान विधि:</span>
                          <span className="font-medium capitalize">
                            {transaction.paymentMethod === 'bank_transfer' ? 'बैंक ट्रांसफर' :
                             transaction.paymentMethod === 'upi' ? 'UPI' : 'डिजिटल वॉलेट'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button className="flex-1 py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                      विवरण देखें / View Details
                    </button>
                    {['payment_initiated', 'payment_completed'].includes(transaction.status) && (
                      <button className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                        ट्रैक करें / Track
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Status Overview */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <CreditCard size={24} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">भुगतान स्थिति</h3>
            <p className="text-sm text-gray-600">Payment Status Overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Pending Payments */}
          {pendingPayments > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">भुगतान प्रक्रिया में</p>
                  <p className="text-sm text-yellow-700">
                    {pendingPayments} payments being processed / {pendingPayments} भुगतान प्रक्रिया में
                  </p>
                </div>
                <button className="text-yellow-700 font-medium text-sm hover:text-yellow-800">
                  ट्रैक करें
                </button>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard size={16} className="text-white" />
              </div>
              <p className="text-sm font-medium text-blue-800">बैंक ट्रांसफर</p>
              <p className="text-xs text-blue-600">1-2 दिन</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs font-bold">UPI</span>
              </div>
              <p className="text-sm font-medium text-green-800">UPI</p>
              <p className="text-xs text-green-600">तुरंत</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wallet size={16} className="text-white" />
              </div>
              <p className="text-sm font-medium text-purple-800">वॉलेट</p>
              <p className="text-xs text-purple-600">तुरंत</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Opportunities */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">बाज़ार के अवसर</h3>
              <p className="text-sm text-gray-600">Market Opportunities</p>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              सभी देखें
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {availableProduce.slice(0, 3).map((produce) => (
            <div key={produce.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
              <img 
                src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
                alt={produce.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-gray-800">{produce.name}</p>
                  {produce.bids.length > 0 && (
                    <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                      <Star size={12} className="text-orange-600" />
                      <span className="text-xs text-orange-700 font-medium">
                        {produce.bids.length} bids
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin size={12} className="mr-1" />
                  <span>{produce.location}</span>
                </div>
                <p className="text-xs text-gray-500">{produce.quantity} {produce.unit} उपलब्ध</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-green-600">₹{produce.currentPrice.toLocaleString()}</p>
                <p className="text-xs text-gray-500">per {produce.unit}</p>
                <button className="mt-1 p-1 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                  <Eye size={14} className="text-blue-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">त्वरित कार्य / Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <BarChart3 size={24} className="text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-800">मार्केट एनालिसिस</p>
              <p className="text-xs text-blue-600">Market Analysis</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FileText size={24} className="text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-800">रिपोर्ट डाउनलोड</p>
              <p className="text-xs text-green-600">Download Reports</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Phone size={24} className="text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-800">सहायता केंद्र</p>
              <p className="text-xs text-purple-600">Support Center</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Calendar size={24} className="text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-orange-800">डिलीवरी शेड्यूल</p>
              <p className="text-xs text-orange-600">Delivery Schedule</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TraderDashboard;