import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard,
  Shield,
  Truck,
  Package
} from 'lucide-react';

interface PaymentStatusCardProps {
  status: 'pending' | 'processing' | 'confirmed' | 'in_transit' | 'delivered' | 'completed';
  amount: number;
  transactionId: string;
  estimatedCompletion?: string;
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  status,
  amount,
  transactionId,
  estimatedCompletion
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          title: 'भुगतान लंबित / Payment Pending',
          description: 'डील कन्फर्मेशन का इंतजार / Waiting for deal confirmation'
        };
      case 'processing':
        return {
          icon: CreditCard,
          color: 'text-blue-600 bg-blue-100 border-blue-200',
          title: 'भुगतान प्रक्रिया में / Payment Processing',
          description: 'बैंक द्वारा भुगतान प्रक्रिया / Bank processing payment'
        };
      case 'confirmed':
        return {
          icon: Shield,
          color: 'text-green-600 bg-green-100 border-green-200',
          title: 'भुगतान सुरक्षित / Payment Secured',
          description: 'एस्क्रो में सुरक्षित / Secured in escrow'
        };
      case 'in_transit':
        return {
          icon: Truck,
          color: 'text-orange-600 bg-orange-100 border-orange-200',
          title: 'फसल ट्रांजिट में / Produce in Transit',
          description: 'डिलीवरी के बाद भुगतान / Payment after delivery'
        };
      case 'delivered':
        return {
          icon: Package,
          color: 'text-purple-600 bg-purple-100 border-purple-200',
          title: 'फसल डिलीवर / Produce Delivered',
          description: 'गुणवत्ता जांच के बाद भुगतान / Payment after quality check'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100 border-green-200',
          title: 'भुगतान पूर्ण / Payment Completed',
          description: 'किसान को भुगतान हो गया / Payment sent to farmer'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          title: 'अज्ञात स्थिति / Unknown Status',
          description: 'स्थिति अपडेट का इंतजार / Waiting for status update'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-6 ${config.color}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.color}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{config.title}</h3>
          <p className="text-sm opacity-80">{config.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80">राशि / Amount:</span>
          <span className="font-bold text-lg">₹{amount.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80">Transaction ID:</span>
          <span className="font-mono text-sm">{transactionId}</span>
        </div>

        {estimatedCompletion && (
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80">अनुमानित समय / ETA:</span>
            <span className="text-sm font-medium">{estimatedCompletion}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              width: getProgressWidth(status),
              backgroundColor: 'currentColor'
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-70">
          <span>शुरुआत</span>
          <span>पूर्ण</span>
        </div>
      </div>
    </div>
  );
};

const getProgressWidth = (status: string): string => {
  switch (status) {
    case 'pending': return '10%';
    case 'processing': return '25%';
    case 'confirmed': return '40%';
    case 'in_transit': return '65%';
    case 'delivered': return '85%';
    case 'completed': return '100%';
    default: return '0%';
  }
};

export default PaymentStatusCard;