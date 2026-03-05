import React from 'react';
import { TrendingUp, Package, IndianRupee as Rupee, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Produce, MarketPrice, Transaction } from '../../types';

interface FarmerDashboardProps {
  produces: Produce[];
  marketPrices: MarketPrice[];
  transactions: Transaction[];
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ 
  produces, 
  marketPrices, 
  transactions 
}) => {
  const activeProduces = produces.filter(p => p.status === 'active');
  const totalBids = produces.reduce((sum, p) => sum + p.bids.length, 0);
  const pendingTransactions = transactions.filter(t => t.status !== 'completed');

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp size={16} className="text-green-600" />;
      case 'down': return <ArrowDown size={16} className="text-red-600" />;
      default: return <Minus size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{activeProduces.length}</p>
              <p className="text-sm text-gray-600">सक्रिय उत्पाद</p>
              <p className="text-xs text-gray-500">Active Products</p>
            </div>
            <Package className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{totalBids}</p>
              <p className="text-sm text-gray-600">कुल बोलियां</p>
              <p className="text-xs text-gray-500">Total Bids</p>
            </div>
            <TrendingUp className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Today's Market Prices */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">आज के बाज़ार भाव</h3>
          <p className="text-sm text-gray-600">Today's Market Prices</p>
        </div>
        
        <div className="p-4 space-y-3">
          {marketPrices.slice(0, 4).map((price) => (
            <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{price.produce}</p>
                <p className="text-sm text-gray-600">{price.mandi}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-bold text-gray-800">₹{price.price}/क्विंटल</p>
                  <div className="flex items-center justify-end space-x-1">
                    {getTrendIcon(price.trend)}
                    <span className={`text-sm font-medium ${
                      price.change > 0 ? 'text-green-600' : 
                      price.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {price.change > 0 ? '+' : ''}{price.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">हाल की गतिविधि</h3>
          <p className="text-sm text-gray-600">Recent Activity</p>
        </div>
        
        <div className="p-4">
          {produces.slice(0, 3).map((produce) => (
            <div key={produce.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
              <img 
                src={produce.images[0] || "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg"} 
                alt={produce.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{produce.name}</p>
                <p className="text-sm text-gray-600">{produce.quantity} {produce.unit}</p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-green-600">₹{produce.currentPrice}</p>
                <p className="text-sm text-gray-500">{produce.bids.length} bids</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">लंबित लेन-देन</h3>
            <p className="text-sm text-gray-600">Pending Transactions</p>
          </div>
          
          <div className="p-4 space-y-3">
            {pendingTransactions.slice(0, 2).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Transaction #{transaction.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">₹{transaction.amount} - {transaction.quantity}kg</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-orange-500" />
                  <span className="text-sm font-medium text-orange-600 capitalize">
                    {transaction.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;