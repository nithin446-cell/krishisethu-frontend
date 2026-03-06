import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './lib/contexts/AuthContext';
import { DataProvider } from './lib/contexts/DataContext';
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

// Removed mockData imports
import { User, Produce, Bid } from './types';

function AppContent() {
  const [appState, setAppState] = useState<'splash' | 'language' | 'auth' | 'main'>('splash');
  const [activeTab, setActiveTab] = useState('dashboard');

  const { user: currentUser, isAuthenticated, isLoading, login, logout } = useAuth();

  // States
  const [produces, setProduces] = useState<Produce[]>([]); // Leaving for legacy components
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

  const handleLogin = async (userType: 'farmer' | 'trader' | 'admin', userId?: string) => {
    // We use userId as phone since LoginRegistration passes phone there
    await login(userId || '9999999999', userType);
    setAppState('main');
  };

  const handleLogout = async () => {
    await logout();
    setAppState('auth');
    setActiveTab('dashboard'); // Reset tab state on logout
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No active transaction</h2>
          <p className="text-gray-600 mb-4">Please select a transaction from your dashboard to track.</p>
          <button onClick={handleBackFromTransaction} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Back to Dashboard</button>
        </div>
      </div>
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
          messages={[]}
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
          onContactFarmer={() => setChatUser({
            id: selectedProduce.farmerId,
            name: 'Farmer',
            type: 'farmer',
            location: 'India',
            verified: true,
            phone: ''
          })}
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
            </div>
          );
        }

        if (user.type === 'admin') {
          return renderAdminContent();
        }

        return null;

      case 'market':
        return <EnhancedMarketPrices prices={[]} />;

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
              <p className="text-sm text-gray-600">No active conversations</p>
            </div>
            {/* Conversations list would go here */}
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
        return <GovernmentSchemes schemes={[]} />;

      case 'traders':
        return (
          <TraderListingsForFarmers
            traders={[]}
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
    <>
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
              onLogout={handleLogout}
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

      {isLoading && appState === 'main' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;