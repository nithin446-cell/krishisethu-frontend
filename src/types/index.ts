export interface User {
  id: string;
  name: string;
  phone: string;
  type: 'farmer' | 'trader' | 'admin';
  location: string;
  verified: boolean;
  avatar?: string;
  documents?: string[];
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
}

export interface Produce {
  id: string;
  farmerId: string;
  name: string;
  variety: string;
  quantity: number;
  unit: 'kg' | 'quintal' | 'ton';
  basePrice: number;
  currentPrice: number;
  images: string[];
  description: string;
  location: string;
  harvestDate: string;
  status: 'active' | 'bidding' | 'sold' | 'expired';
  bids: Bid[];
  verified?: boolean;
}

export interface Bid {
  id: string;
  traderId: string;
  traderName: string;
  amount: number;
  quantity: number;
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Transaction {
  id: string;
  produceId: string;
  farmerId: string;
  traderId: string;
  amount: number;
  quantity: number;
  status: 'pending' | 'deal_accepted' | 'produce_collected' | 'payment_initiated' | 'payment_completed' | 'completed';
  timeline: TransactionStep[];
  paymentMethod?: 'bank_transfer' | 'upi' | 'digital_wallet';
  paymentStatus?: 'pending' | 'processing' | 'confirmed' | 'completed';
  dealConfirmedAt?: string;
  produceCollectedAt?: string;
  paymentInitiatedAt?: string;
  paymentCompletedAt?: string;
  deliveryDetails?: {
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    pickupLocation?: string;
    deliveryLocation?: string;
    estimatedDelivery?: string;
  };
}

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface MarketPrice {
  id: string;
  produce: string;
  mandi: string;
  price: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface GovernmentScheme {
  id: string;
  title: string;
  description: string;
  category: 'subsidy' | 'loan' | 'insurance' | 'training';
  eligibility: string[];
  benefits: string;
  applicationLink: string;
  image: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  type: 'quality' | 'payment' | 'delivery' | 'other';
  farmerId: string;
  traderId: string;
  farmerName: string;
  traderName: string;
  amount: number;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  adminNotes?: string;
}

export interface PriceUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  recordsCount: number;
  status: 'success' | 'failed' | 'processing';
  errorMessage?: string;
}