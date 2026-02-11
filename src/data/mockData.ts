import { User, Produce, MarketPrice, Transaction, GovernmentScheme, Message } from '../types';

export const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Ram Kumar',
    phone: '+91-9876543210',
    type: 'farmer',
    location: 'Khadakwasla, Pune',
    verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Shyam Trader',
    phone: '+91-9876543211',
    type: 'trader',
    location: 'APMC Market, Pune',
    verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Admin User',
    phone: '+91-9876543212',
    type: 'admin',
    location: 'Platform Admin',
    verified: true
  }
];

export const mockProduce: Produce[] = [
  {
    id: '1',
    farmerId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Wheat',
    variety: 'HD-2967',
    quantity: 100,
    unit: 'quintal',
    basePrice: 2200,
    currentPrice: 2200,
    images: ['https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg'],
    description: 'High quality wheat, well cleaned and sorted',
    location: 'Khadakwasla, Pune',
    harvestDate: '2024-03-15',
    status: 'active',
    verified: true,
    bids: [
      {
        id: 'b1',
        traderId: '550e8400-e29b-41d4-a716-446655440002',
        traderName: 'Shyam Trader',
        amount: 2300,
        quantity: 50,
        message: 'Premium price for good quality',
        timestamp: new Date().toISOString(),
        status: 'pending'
      }
    ]
  },
  {
    id: '2',
    farmerId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Rice',
    variety: 'IR-64',
    quantity: 75,
    unit: 'quintal',
    basePrice: 1800,
    currentPrice: 1950,
    images: ['https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg'],
    description: 'Basmati rice, long grain variety',
    location: 'Khadakwasla, Pune',
    harvestDate: '2024-03-10',
    status: 'active',
    verified: false,
    bids: []
  }
];

export const mockMarketPrices: MarketPrice[] = [
  {
    id: '1',
    produce: 'Wheat',
    mandi: 'Pune APMC',
    price: 2250,
    change: 50,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    produce: 'Rice',
    mandi: 'Pune APMC',
    price: 1900,
    change: -25,
    trend: 'down',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    produce: 'Maize',
    mandi: 'Mumbai APMC',
    price: 1650,
    change: 0,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    produce: 'Potato',
    mandi: 'Delhi APMC',
    price: 800,
    change: 75,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '5',
    produce: 'Wheat',
    mandi: 'Baramati APMC',
    price: 2180,
    change: 30,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '6',
    produce: 'Wheat',
    mandi: 'Nashik APMC',
    price: 2320,
    change: 80,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '7',
    produce: 'Rice',
    mandi: 'Baramati APMC',
    price: 1850,
    change: -50,
    trend: 'down',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '8',
    produce: 'Rice',
    mandi: 'Mumbai APMC',
    price: 1950,
    change: 25,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '9',
    produce: 'Onion',
    mandi: 'Pune APMC',
    price: 1200,
    change: 150,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '10',
    produce: 'Onion',
    mandi: 'Nashik APMC',
    price: 1100,
    change: 100,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '11',
    produce: 'Tomato',
    mandi: 'Pune APMC',
    price: 2500,
    change: -200,
    trend: 'down',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '12',
    produce: 'Tomato',
    mandi: 'Mumbai APMC',
    price: 2800,
    change: -100,
    trend: 'down',
    lastUpdated: new Date().toISOString()
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    produceId: '1',
    farmerId: '550e8400-e29b-41d4-a716-446655440001',
    traderId: '550e8400-e29b-41d4-a716-446655440002',
    amount: 115000,
    quantity: 50,
    status: 'payment_initiated',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'confirmed',
    dealConfirmedAt: '2024-01-15T10:30:00Z',
    produceCollectedAt: '2024-01-15T14:00:00Z',
    paymentInitiatedAt: '2024-01-15T14:30:00Z',
    deliveryDetails: {
      vehicleNumber: 'MH 12 AB 1234',
      driverName: 'Ramesh Kumar',
      driverPhone: '+91 98765 43210',
      pickupLocation: 'Khadakwasla, Pune, Maharashtra',
      deliveryLocation: 'APMC Market, Pune',
      estimatedDelivery: '2024-01-15T18:00:00Z'
    },
    timeline: [
      {
        id: 't1',
        title: 'Bid Accepted',
        description: 'Farmer has accepted your bid',
        timestamp: new Date().toISOString(),
        completed: true
      },
      {
        id: 't2',
        title: 'Payment Confirmation',
        description: 'Payment process is underway',
        timestamp: '',
        completed: false
      }
    ]
  }
];

export const mockGovernmentSchemes: GovernmentScheme[] = [
  {
    id: '1',
    title: 'PM Kisan Samman Nidhi',
    description: 'A central sector scheme by Government of India that provides income support to small and marginal farmers.',
    category: 'subsidy',
    eligibility: [
      'Cultivable land up to 2 hectares',
      'Must be an Indian citizen',
      'Aadhaar card and bank account required'
    ],
    benefits: '₹6,000 per year in three installments',
    applicationLink: 'https://pmkisan.gov.in',
    image: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
  },
  {
    id: '2',
    title: 'Crop Insurance Scheme',
    description: 'Provides insurance cover to farmers against losses due to natural calamities.',
    category: 'insurance',
    eligibility: [
      'All farmers are eligible',
      'For notified crops only',
      'Application within specified time limit'
    ],
    benefits: 'Insurance amount payment on crop loss',
    applicationLink: 'https://pmfby.gov.in',
    image: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg'
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '550e8400-e29b-41d4-a716-446655440002',
    receiverId: '550e8400-e29b-41d4-a716-446655440001',
    content: 'Hello, how is your wheat quality?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: '2',
    senderId: '550e8400-e29b-41d4-a716-446655440001',
    receiverId: '550e8400-e29b-41d4-a716-446655440002',
    content: 'Very good wheat quality, would you like to see it?',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    read: true
  },
  {
    id: '3',
    senderId: '550e8400-e29b-41d4-a716-446655440002',
    receiverId: '550e8400-e29b-41d4-a716-446655440001',
    content: 'Yes, I will come tomorrow to see it.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  }
];