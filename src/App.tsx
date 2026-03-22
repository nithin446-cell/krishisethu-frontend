import { useState, useEffect } from 'react';
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
import MandiPriceFeed from './components/Market/MandiPriceFeed';
import TraderListings from './components/Trader/TraderListings';
import EnhancedBiddingSystem from './components/Bidding/EnhancedBiddingSystem';
import EnhancedChatInterface from './components/Chat/EnhancedChatInterface'; 
import TransactionTracking from './components/Transaction/TransactionTracking';
import GovernmentSchemes from './components/Government/GovernmentSchemes';
import TraderListingsForFarmers from './components/Trader/TraderListingsForFarmers';
import OldAdminDashboard from './components/Admin/AdminDashboard';
import TraderVerification from './components/Admin/TraderVerification';
import DisputeResolution from './components/Admin/DisputeResolution';
import PriceDataUpload from './components/Admin/PriceDataUpload';
import SchemeManagement from './components/Admin/SchemeManagement';
import TraderDashboard from './components/Trader/TraderDashboard';
import UserProfile from './components/profile/UserProfile';

import AdminDashboard from './components/AdminDashboard';

// Supabase Import
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import BankAccountSetup from './components/Farmer/BankAccountSetup';
import OrderTracking from './components/OrderTracking';
import FarmerKYC from './components/FarmerKYC';
import { Landmark, ChevronRight, CheckCircle } from 'lucide-react';
import { User, Produce, Bid } from './types';

function AppContent() {
  const [appState, setAppState] = useState<'splash' | 'language' | 'auth' | 'main'>('splash');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);

  const { user: currentUser, isAuthenticated, isLoading, logout } = useAuth();

  // States
  const [produces, setProduces] = useState<Produce[]>([]); 
  const [selectedProduce, setSelectedProduce] = useState<Produce | null>(null);
  const [showBidding, setShowBidding] = useState(false);
  const [chatConfig, setChatConfig] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const handleSplashComplete = () => setAppState('language');
  const handleLanguageContinue = () => setAppState('auth');
  const handleAuthSuccess = () => setAppState('main');

  useEffect(() => {
    if (currentUser?.id) {
      api.getMyBankAccount()
        .then(res => {
          setHasBankAccount(res?.has_account && res?.is_verified);
        })
        .catch(err => {
          console.error("Failed to fetch bank account status:", err);
          setHasBankAccount(false);
        });
    }
  }, [currentUser?.id]); // Using currentUser?.id here to avoid exhaustive deps warning

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
        return <OldAdminDashboard />; 
      case 'verification':
        return <TraderVerification onBack={() => setAdminSection('dashboard')} />;
      case 'disputes':
        return <DisputeResolution onBack={() => setAdminSection('dashboard')} />;
      case 'prices':
        return <PriceDataUpload onBack={() => setAdminSection('dashboard')} />;
      case 'schemes':
        return <SchemeManagement onBack={() => setAdminSection('dashboard')} />;
      default:
        return <OldAdminDashboard />;
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const user = currentUser;

    if (chatConfig) {
      return (
        <EnhancedChatInterface
          orderId={chatConfig.orderId} 
          currentUserId={user.id}
          otherUserId={chatConfig.otherUserId}
          otherUserName={chatConfig.otherUserName}
          onClose={() => setChatConfig(null)}
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
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        if (user.type === 'farmer') return (
          <>
            {!hasBankAccount && user.type === 'farmer' && (
              <div
                onClick={() => setActiveTab('bank-setup')}
                className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Landmark size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Add Bank Account to Receive Payments</p>
                  <p className="text-xs text-amber-600">Payments will be held until you add a verified bank account.</p>
                </div>
                <ChevronRight size={16} className="text-amber-500 shrink-0" />
              </div>
            )}
            <div className={hasBankAccount === false ? "" : "mt-4"}>
              <EnhancedDashboard farmerId={user.id} onViewOrderTracking={(orderId) => {
                setTrackingOrderId(orderId);
                setActiveTab('order-tracking');
              }} />
            </div>
          </>
        );
        if (user.type === 'trader') return <div className="p-4 space-y-6"><TraderDashboard traderId={user.id} availableProduce={produces} onViewOrderTracking={(orderId) => {
          setTrackingOrderId(orderId);
          setActiveTab('order-tracking');
        }} /></div>;
        if (user.type === 'admin') return renderAdminContent();
        return null;

      case 'market':
        const myCropNames = produces
          .filter(p => p.farmerId === currentUser?.id)
          .map(p => p.name);
        return (
          <MandiPriceFeed 
            userCrops={myCropNames} 
            userState={currentUser?.location || 'Karnataka'} 
            onBack={() => setActiveTab('dashboard')} 
          />
        );

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

      case 'add':
        return <EnhancedAddProduce onSubmit={handleAddProduce} onBack={() => setActiveTab('dashboard')} farmerId={user.id} />;

      case 'profile':
        return (
          <div className="space-y-4 pb-4 h-full p-4">
            <UserProfile userId={user.id} initialUser={user} />
            
            <button
              onClick={() => setActiveTab('bank-setup')}
              className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                hasBankAccount ? 'bg-green-100' : 'bg-indigo-100'
              }`}>
                <Landmark size={22} className={hasBankAccount ? 'text-green-600' : 'text-indigo-600'} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800">
                  {hasBankAccount ? 'Bank Account' : 'Add Bank Account'}
                </p>
                <p className="text-sm text-gray-500">
                  {hasBankAccount
                    ? `${(user as any).bank_id || 'Linked'} · Verified`
                    : user.type === 'farmer'
                      ? 'Required to receive payments'
                      : 'Add account for refunds & payouts'}
                </p>
              </div>
              {hasBankAccount
                ? <CheckCircle size={20} className="text-green-500 shrink-0" />
                : <ChevronRight size={20} className="text-gray-400 shrink-0" />
              }
            </button>
          </div>
        );

      case 'bank-setup':
        return <BankAccountSetup userId={currentUser.id} userRole={currentUser.type as 'farmer' | 'trader'}
          onComplete={() => {
            setHasBankAccount(true);
            setActiveTab('profile');
          }} 
          onBack={() => setActiveTab('profile')} />;

      case 'kyc':
        return <FarmerKYC userId={currentUser.id} userName={(currentUser as any).full_name || currentUser.name}
          onComplete={() => setActiveTab('profile')} onBack={() => setActiveTab('profile')} />;

      case 'order-tracking':
        return <OrderTracking orderId={trackingOrderId} currentUserId={currentUser.id}
          userRole={currentUser.type as 'farmer' | 'trader'} onBack={() => setActiveTab(currentUser.type === 'farmer' ? 'dashboard' : 'dashboard')}
          onOpenChat={(orderId, id, name) => setChatConfig({ orderId, otherUserId: id, otherUserName: name })} />;

      case 'schemes':
        return <GovernmentSchemes schemes={[]} />;

      case 'traders':
        return (
          <TraderListingsForFarmers
            traders={[]}
            myProduce={produces.filter(p => p.farmerId === currentUser.id)}
          />
        );

      default:
        return <div>Page not found</div>;
    }
  };

  if (appState === 'main' && currentUser && ((currentUser as any).role === 'admin' || currentUser.type === 'admin')) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <>
      {appState === 'language' && <LanguageSelection onContinue={handleLanguageContinue} />}
      {appState === 'auth' && <LoginRegistration onLogin={handleAuthSuccess} />}

      {appState === 'main' && currentUser && (
        <div className="min-h-screen bg-gray-50 relative">
          
          {!chatConfig && !showBidding && !showTransaction && (
            <Header userName={currentUser.name} location={currentUser.location} unreadCount={3} onLogout={handleLogout} />
          )}

          <main className={`${!chatConfig && !showBidding && !showTransaction ? 'pt-4 pb-20' : 'pb-20 h-screen'}`}>
            {renderContent()}
          </main>

          {!chatConfig && !showBidding && !showTransaction && (
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