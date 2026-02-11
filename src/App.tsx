import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import SplashScreen from './components/Onboarding/SplashScreen';
import LanguageSelection from './components/Onboarding/LanguageSelection';
import LoginRegistration from './components/Auth/LoginRegistration';
import Navigation from './components/Layout/Navigation';
import Header from './components/Layout/Header';
import EnhancedDashboard from './components/Farmer/EnhancedDashboard';
import EnhancedAddProduce from './components/Farmer/EnhancedAddProduce';
import EnhancedMarketPrices from './components/Market/EnhancedMarketPrices';
import TraderListings from './components/Trader/TraderListings';
import EnhancedBiddingSystem from './components/Bidding/EnhancedBiddingSystem';
import EnhancedChatInterface from './components/Chat/EnhancedChatInterface';
import TransactionTracking from './components/Transaction/TransactionTracking';
import GovernmentSchemes from './components/Government/GovernmentSchemes';
import TraderListingsForFarmers from './components/Trader/TraderListingsForFarmers';
import AdminDashboard from './components/Admin/AdminDashboard.tsx';
import TraderVerification from './components/Admin/TraderVerification';
import DisputeResolution from './components/Admin/DisputeResolution';
import PriceDataUpload from './components/Admin/PriceDataUpload';
import SchemeManagement from './components/Admin/SchemeManagement';
import TraderDashboard from './components/Trader/TraderDashboard';
import {
  mockUsers,
  mockProduce,
  mockMarketPrices,
  mockTransactions,
  mockGovernmentSchemes,
  mockMessages
} from './data/mockData';
import { User, Produce, Bid } from './types';

function App() {
  const [appState, setAppState] = useState<'splash' | 'language' | 'auth' | 'main'>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [produces, setProduces] = useState(mockProduce);
  const [selectedProduce, setSelectedProduce] = useState<Produce | null>(null);
  const [showBidding, setShowBidding] = useState(false);
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');

  const handleSplashComplete = () => {
    setAppState('language');
  };


  const handleLanguageContinue = () => {
    setAppState('auth');
  };

  const handleLogin = (userType: 'farmer' | 'trader' | 'admin') => {
    const user = mockUsers.find(u => u.type === userType) || mockUsers[0];
    setCurrentUser(user);
    setAppState('main');
  };

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  const handleAddProduce = (produceData: any) => {
    const newProduce: Produce = {
      id: produceData.id,
      farmerId: produceData.farmer_id,
      name: produceData.name,
      variety: produceData.variety || '',
      quantity: produceData.quantity,
      unit: produceData.unit,
      basePrice: produceData.base_price,
      currentPrice: produceData.current_price,
      images: produceData.images.length > 0 ? produceData.images : [
        'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg'
      ],
      description: produceData.description || '',
      location: produceData.location,
      harvestDate: produceData.harvest_date || '',
      status: produceData.status as 'active' | 'bidding' | 'sold' | 'expired',
      bids: []
    };
    setProduces([...produces, newProduce]);
    setActiveTab('dashboard');
  };

  const handlePlaceBid = (bid: Omit<Bid, 'id' | 'timestamp'>) => {
    if (!selectedProduce) return;
    const newBid: Bid = {
      ...bid,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const updatedProduces = produces.map(p =>
      p.id === selectedProduce.id
        ? { ...p, bids: [...p.bids, newBid], currentPrice: Math.max(p.currentPrice, bid.amount) }
        : p
    );
    setProduces(updatedProduces);
    setSelectedProduce({ ...selectedProduce, bids: [...selectedProduce.bids, newBid] });
  };

  const handleSendMessage = (content: string) => {
    // In real app, this would send to backend
    console.log('Sending message:', content);
  };

  const handleViewTransaction = () => {
    setShowTransaction(true);
  };

  const handleBackFromTransaction = () => {
    setShowTransaction(false);
  };

  const handleContactSupport = () => {
    console.log('Contacting support...');
  };

  if (showTransaction) {
    return (
      <TransactionTracking
        transaction={mockTransactions[0]} // Use mockTransactions[0] directly
        onBack={handleBackFromTransaction}
        onContactSupport={handleContactSupport}
      />
    );
  }

  const renderContent = () => {
    if (!currentUser) return null;
    const user = currentUser;

    if (chatUser) {
      return (
        <EnhancedChatInterface
          currentUser={user}
          otherUser={chatUser}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          onBack={() => setChatUser(null)}
        />
      );
    }

    if (showBidding && selectedProduce) {
      return (
        <EnhancedBiddingSystem
          produce={selectedProduce}
          onPlaceBid={handlePlaceBid}
          currentUserId={user.type === 'trader' ? user.id : '2'}
          onBack={() => setShowBidding(false)}
          onContactFarmer={() => setChatUser(mockUsers.find(u => u.id === selectedProduce.farmerId) || mockUsers[0])}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        if (user.type === 'farmer') {
          return (
            <EnhancedDashboard
              produces={produces.filter(p => p.farmerId === user.id)}
              marketPrices={mockMarketPrices}
              transactions={mockTransactions}
              onAddProduce={() => setActiveTab('add')}
              onViewPrices={() => setActiveTab('market')}
              onViewSchemes={() => setActiveTab('schemes')}
              onViewTraders={() => setActiveTab('traders')}
            />
          );
        }

        if (user.type === 'trader') {
          return (
            <div className="p-4 space-y-6">
              <TraderDashboard
                availableProduce={produces}
                myTransactions={mockTransactions}
              />
              <button
                onClick={handleViewTransaction}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                लेन-देन ट्रैक करें / Track Transaction
              </button>
            </div>
          );
        }

        if (user.type === 'admin') {
          return renderAdminContent();
        }

        return null;
      
      case 'market':
        return <EnhancedMarketPrices prices={mockMarketPrices} />;
      
      case 'browse':
        return (
          <TraderListings
            produces={produces}
            onViewProduce={(produce) => {
              setSelectedProduce(produce);
              setShowBidding(true);
            }}
          />
        );
      
      case 'add':
        return (
          <EnhancedAddProduce
            onSubmit={handleAddProduce}
            onBack={() => setActiveTab('dashboard')}
            farmerId={currentUser.id}
          />
        );
      
      case 'chat':
        return (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">चैट</h2>
              <p className="text-sm text-gray-600">Messages</p>
            </div>
            {mockUsers.filter(u => u.id !== currentUser.id).map((user) => (
              <div 
                key={user.id}
                onClick={() => setChatUser(user)}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{user.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.location}</p>
                  </div>
                  {user.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'profile':
        return (
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">प्रोफ़ाइल</h2>
              <p className="text-sm text-gray-600">Profile</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl font-bold">{currentUser.name.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{currentUser.name}</h3>
                <p className="text-gray-600">{currentUser.location}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">फ़ोन नंबर</span>
                  <span className="font-medium">{currentUser.phone}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">प्रकार</span>
                  <span className="font-medium capitalize">{currentUser.type === 'farmer' ? 'किसान' : 'व्यापारी'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">सत्यापन स्थिति</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentUser.verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentUser.verified ? 'सत्यापित' : 'गैर-सत्यापित'}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  सरकारी योजनाएं देखें
                </button>
              </div>
            </div>
          </div>
        );

      case 'schemes':
        return <GovernmentSchemes schemes={mockGovernmentSchemes} />;
      
      case 'traders':
        return (
          <TraderListingsForFarmers
            traders={mockUsers.filter(u => u.type === 'trader')}
            myProduce={produces.filter(p => p.farmerId === currentUser.id)}
            onContactTrader={(trader) => setChatUser(trader)}
          />
        );
      
      default:
        return <div>Page not found</div>;
    }
  };

  const renderAdminContent = () => {
    switch (adminSection) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setAdminSection} />;
      case 'verification':
        return <TraderVerification onBack={() => setAdminSection('dashboard')} />;
      case 'disputes':
        return <DisputeResolution onBack={() => setAdminSection('dashboard')} />;
      case 'prices':
        return <PriceDataUpload onBack={() => setAdminSection('dashboard')} />;
      case 'schemes':
        return <SchemeManagement onBack={() => setAdminSection('dashboard')} />;
      default:
        return <AdminDashboard onNavigate={setAdminSection} />;
    }
  };

  return (
    <LanguageProvider>
      {appState === 'language' && (
        <LanguageSelection onContinue={handleLanguageContinue} />
      )}

      {appState === 'auth' && <LoginRegistration onLogin={handleLogin} />}

      {appState === 'main' && currentUser && (
        <div className="min-h-screen bg-gray-50">
          {!chatUser && !showBidding && !showTransaction && (
            <Header 
              userName={currentUser.name}
              location={currentUser.location}
              unreadCount={3}
            />
          )}
          
          <main className={`${!chatUser && !showBidding && !showTransaction ? 'pt-4 pb-20' : 'pb-20 h-screen'}`}>
            {renderContent()}
          </main>
          
          {!chatUser && !showBidding && !showTransaction && (
            <Navigation
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (currentUser.type === 'admin') {
                  setAdminSection(tab);
                } else {
                  setActiveTab(tab);
                }
              }}
              userType={currentUser.type}
            />
          )}
        </div>
      )}

      {!currentUser && appState === 'main' && <div>Loading...</div>}
    </LanguageProvider>
  );
}

export default App;
