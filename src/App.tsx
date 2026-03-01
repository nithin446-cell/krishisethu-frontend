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
import AdminDashboard from './components/Admin/AdminDashboard';
import TraderVerification from './components/Admin/TraderVerification';
import DisputeResolution from './components/Admin/DisputeResolution';
import PriceDataUpload from './components/Admin/PriceDataUpload';
import SchemeManagement from './components/Admin/SchemeManagement';
import TraderDashboard from './components/Trader/TraderDashboard';

// Supabase Import
import { supabase } from './lib/supabase';

// Mock Data (Kept for components not yet migrated to backend)
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

  // States
  const [produces, setProduces] = useState(mockProduce); // Leaving for legacy components
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

  // UPDATED: Now accepts real userId from Supabase Auth and fetches profile
  const handleLogin = async (userType: 'farmer' | 'trader' | 'admin', userId?: string) => {
    let userData: any = {
      id: userId || crypto.randomUUID(),
      type: userType,
      name: `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
      location: 'India',
      verified: true,
      phone: ''
    };

    if (userId) {
      // Fetch actual user profile from our public.users table
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        userData.name = data.full_name || userData.name;
        userData.phone = data.phone || '';
      }
    }

    setCurrentUser(userData);
    setAppState('main');
  };

  const handleAddProduce = (produceData: any) => {
    // Note: EnhancedAddProduce handles real DB insert now. 
    // This is just to update local legacy state if needed.
    setActiveTab('dashboard');
  };

  const handlePlaceBid = (bid: Omit<Bid, 'id' | 'timestamp'>) => {
    // Note: EnhancedBiddingSystem handles real DB insert now.
    setShowBidding(false);
  };

  const handleSendMessage = (content: string) => {
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

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (showTransaction) {
    return (
      <TransactionTracking
        transaction={mockTransactions[0]}
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
          currentUserId={user.id} // Passed real ID
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
              farmerId={user.id} // Passed real ID for fetching live listings
            />
          );
        }

        if (user.type === 'trader') {
          return (
            <div className="p-4 space-y-6">
              <TraderDashboard
                traderId={user.id} // Passed real ID for disputes
                availableProduce={produces}
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
            traderId={user.id} // Passed real ID
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
            farmerId={user.id} // Passed real ID
          />
        );

      case 'chat':
        return (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">चैट</h2>
              <p className="text-sm text-gray-600">Messages</p>
            </div>
            {mockUsers.filter(u => u.id !== currentUser.id).map((u) => (
              <div
                key={u.id}
                onClick={() => setChatUser(u)}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{u.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{u.name}</h3>
                    <p className="text-sm text-gray-600">{u.location}</p>
                  </div>
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
                  <span className="font-medium">{currentUser.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">प्रकार</span>
                  <span className="font-medium capitalize">{currentUser.type === 'farmer' ? 'किसान' : 'व्यापारी'}</span>
                </div>
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
        return <AdminDashboard adminId={currentUser!.id} onNavigate={setAdminSection} />; // Passed real ID
      case 'verification':
        return <TraderVerification onBack={() => setAdminSection('dashboard')} />;
      case 'disputes':
        return <DisputeResolution onBack={() => setAdminSection('dashboard')} />;
      case 'prices':
        return <PriceDataUpload onBack={() => setAdminSection('dashboard')} />;
      case 'schemes':
        return <SchemeManagement onBack={() => setAdminSection('dashboard')} />;
      default:
        return <AdminDashboard adminId={currentUser!.id} onNavigate={setAdminSection} />;
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

      {!currentUser && appState === 'main' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </LanguageProvider>
  );
}

export default App;