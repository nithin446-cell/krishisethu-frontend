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
import AIChatbot from './components/Chat/AIChatbot';
import TransactionTracking from './components/Transaction/TransactionTracking';
import GovernmentSchemes from './components/Government/GovernmentSchemes';
import TraderListingsForFarmers from './components/Trader/TraderListingsForFarmers';
import AdminDashboard from './components/Admin/AdminDashboard';
import TraderVerification from './components/Admin/TraderVerification';
import DisputeResolution from './components/Admin/DisputeResolution';
import PriceDataUpload from './components/Admin/PriceDataUpload';
import SchemeManagement from './components/Admin/SchemeManagement';
import TraderDashboard from './components/Trader/TraderDashboard';
import UserProfile from './components/profile/UserProfile';

// Supabase Import
import { supabase } from './lib/supabase';
import { User, Produce, Bid } from './types';

function AppContent() {
  const [appState, setAppState] = useState<'splash' | 'language' | 'auth' | 'main'>('splash');
  const [activeTab, setActiveTab] = useState('dashboard');

  const { user: currentUser, isAuthenticated, isLoading, logout } = useAuth();

  // States
  const [produces, setProduces] = useState<Produce[]>([]); 
  const [selectedProduce, setSelectedProduce] = useState<Produce | null>(null);
  const [showBidding, setShowBidding] = useState(false);
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');

  const handleSplashComplete = () => setAppState('language');
  const handleLanguageContinue = () => setAppState('auth');
  const handleAuthSuccess = () => setAppState('main');

  const handleLogout = async () => {
    await logout();
    setAppState('auth');
    setActiveTab('dashboard'); 
  };

  const handleAddProduce = (produceData: any) => setActiveTab('dashboard');
  const handlePlaceBid = (bid: Omit<Bid, 'id' | 'timestamp'>) => setShowBidding(false);
  const handleBackFromTransaction = () => setShowTransaction(false);

  if (appState === 'splash') return <SplashScreen onComplete={handleSplashComplete} />;

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

  const renderAdminContent = () => {
    switch (adminSection) {
      case 'dashboard':
        return <AdminDashboard />; 
      case 'verification':
        return <TraderVerification onBack={() => setAdminSection('dashboard')} />;
      case 'disputes':
        return <DisputeResolution onBack={() => setAdminSection('dashboard')} />;
      case 'prices':
        return <PriceDataUpload onBack={() => setAdminSection('dashboard')} />;
      case 'schemes':
        return <SchemeManagement onBack={() => setAdminSection('dashboard')} />;
      default:
        return <AdminDashboard />;
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const user = currentUser;

    if (chatUser) {
      return (
        <EnhancedChatInterface
          orderId="legacy_chat_bypass" 
          currentUserId={user.id}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
          onClose={() => setChatUser(null)}
        />
      );
    }

    if (showBidding && selectedProduce) {
      return (
        <EnhancedBiddingSystem
          produce={selectedProduce}
          onPlaceBid={handlePlaceBid}
          currentUserId={user.id} 
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
        if (user.type === 'farmer') return <EnhancedDashboard farmerId={user.id} />;
        if (user.type === 'trader') return <div className="p-4 space-y-6"><TraderDashboard traderId={user.id} availableProduce={produces} /></div>;
        if (user.type === 'admin') return renderAdminContent();
        return null;

      case 'market':
        // 👉 NEW: Removed prices={[]} prop so it fetches its own live data
        return <EnhancedMarketPrices />;

      case 'browse':
        return (
          <TraderListings
            traderId={user.id} 
            onViewProduce={(produce) => {
              setSelectedProduce(produce);
              setShowBidding(true);
            }}
          />
        );

      case 'assistant':
        return <AIChatbot />;

      case 'add':
        return <EnhancedAddProduce onSubmit={handleAddProduce} onBack={() => setActiveTab('dashboard')} farmerId={user.id} />;

      case 'profile':
        return <UserProfile userId={user.id} initialUser={user} />;

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

  return (
    <>
      {appState === 'language' && <LanguageSelection onContinue={handleLanguageContinue} />}
      {appState === 'auth' && <LoginRegistration onLogin={handleAuthSuccess} />}

      {appState === 'main' && currentUser && (
        <div className="min-h-screen bg-gray-50 relative">
          
          {!chatUser && !showBidding && !showTransaction && (
            <Header userName={currentUser.name} location={currentUser.location} unreadCount={3} onLogout={handleLogout} />
          )}

          <main className={`${!chatUser && !showBidding && !showTransaction ? 'pt-4 pb-20' : 'pb-20 h-screen'}`}>
            {renderContent()}
          </main>

          {!chatUser && !showBidding && !showTransaction && (
            <Navigation
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (currentUser.type === 'admin') setAdminSection(tab);
                else setActiveTab(tab);
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