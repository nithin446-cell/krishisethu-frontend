import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
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
import TraderVerification from './components/Admin/TraderVerification';
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
import { Landmark, ChevronRight, CheckCircle, WifiOff, RefreshCw } from 'lucide-react';
import { User, Produce, Bid } from './types';
import { requestForToken, onMessageListener } from './lib/firebase';

// ============================================
// ERROR BOUNDARY — catches React render crashes
// ============================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-1">The app encountered an unexpected error.</p>
            <p className="text-gray-400 text-xs mb-6 font-mono break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// OFFLINE / BACKEND-DOWN BANNER
// ============================================
function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendOnline, setBackendOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  // Monitor browser network status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Periodic backend health check (every 30s when online, every 10s when backend is down)
  useEffect(() => {
    if (!isOnline) {
      setBackendOnline(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      if (cancelled) return;
      setChecking(true);
      const result = await api.healthCheck();
      if (!cancelled) {
        setBackendOnline(result.online);
        setChecking(false);
      }
    };

    check();
    const interval = setInterval(check, backendOnline ? 30000 : 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isOnline, backendOnline]);

  if (isOnline && backendOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-pulse">
      <WifiOff size={16} />
      {!isOnline
        ? 'You are offline. Please check your internet connection.'
        : 'Backend server is unreachable. Retrying automatically...'}
    </div>
  );
}

function AppContent() {
  const [appState, setAppState] = useState<'splash' | 'language' | 'auth' | 'main'>('splash');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);

  const { user: currentUser, isAuthenticated, isLoading, logout, refreshUser, isRecovery } = useAuth();

  // Auto-redirect to main if authenticated (e.g. on page reload or password reset)
  useEffect(() => {
    if (isAuthenticated && appState !== 'main') {
      setAppState('main');
    }
  }, [isAuthenticated, appState]);

  // States
  const [produces, setProduces] = useState<Produce[]>([]); 
  const [selectedProduce, setSelectedProduce] = useState<Produce | null>(null);
  const [showBidding, setShowBidding] = useState(false);
  const [chatConfig, setChatConfig] = useState<{orderId: string, otherUserId: string, otherUserName: string} | null>(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [traders, setTraders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dashboardRefreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleSplashComplete = () => setAppState('language');
  const handleLanguageContinue = () => setAppState('auth');
  const handleAuthSuccess = () => setAppState('main');

  const fetchAppGlobalData = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // 1. Bank Account Status
      const bankRes = await api.getMyBankAccount();
      setHasBankAccount(bankRes?.has_account && bankRes?.is_verified);

      // 2. Schemes & Traders
      api.getGovernmentSchemes().then(setSchemes).catch(err => console.error("Schemes error:", err));
      api.getTraders().then(setTraders).catch(err => console.error("Traders error:", err));

      // 3. Notification Logic
      if (currentUser.type === 'farmer') {
        const orders = await api.getFarmerOrders(currentUser.id).catch(() => []);
        const count = orders.filter((o: any) => o.payment_status === 'processing' || o.status === 'pending').length;
        setUnreadCount(count);
      } else if (currentUser.type === 'trader') {
        const bids = await api.getTraderBids(currentUser.id).catch(() => []);
        const count = bids.filter((b: any) => b.status === 'accepted').length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("[GLOBAL_FETCH_ERROR]", error);
    }
  }, [currentUser?.id, currentUser?.type]);

  useEffect(() => {
    if (currentUser?.id && appState === 'main') {
      fetchAppGlobalData();
    }
  }, [currentUser?.id, appState, fetchAppGlobalData]); 

  const handleRefresh = async () => {
    // 1. Refresh User Profile (Name, Location, Verification)
    await refreshUser();
    // 2. Refresh App Shell Data (Notifications, etc)
    await fetchAppGlobalData();
    // 3. Refresh Active Dashboard Data (Orders, Bids)
    if (dashboardRefreshRef.current) {
      await dashboardRefreshRef.current();
    }
  };

  // 🔔 FCM Notification Registration
  useEffect(() => {
    if (currentUser?.id) {
      requestForToken(currentUser.id);
      
      const unsubscribe = onMessageListener((payload: any) => {
        console.log('Foreground Message:', payload);
        // Show a local alert or toast if needed
        alert(`${payload.notification.title}: ${payload.notification.body}`);
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await logout();
    setAppState('auth');
    setActiveTab('dashboard'); 
  };

  const handleAddProduce = (produceData: any) => setActiveTab('dashboard');
  const handlePlaceBid = (bid: Omit<Bid, 'id' | 'timestamp'>) => setShowBidding(false);
  const handleBackFromTransaction = () => setShowTransaction(false);

  if (appState === 'splash') return <SplashScreen onComplete={handleSplashComplete} />;

  // Special Password Recovery Screen
  if (isRecovery) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
            <p className="text-gray-500 text-sm mt-1">Please enter your new password below.</p>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const password = (e.target as any).newPassword.value;
            try {
              const { error } = await supabase.auth.updateUser({ password });
              if (error) throw error;
              alert('Password updated successfully! Redirecting to dashboard...');
              window.location.reload(); // Reload to clear recovery state and load normally
            } catch (err: any) {
              alert(err.message || 'Failed to update password');
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" name="newPassword" required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter new password" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition">
              Save New Password
            </button>
          </form>
        </div>
      </div>
    );
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

  const renderAdminContent = () => {
    return <AdminDashboard onLogout={handleLogout} />;
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
              }} onRegisterRefresh={(fn) => { dashboardRefreshRef.current = fn; }} />
            </div>
          </>
        );
        if (user.type === 'trader') return <div className="p-4 space-y-6"><TraderDashboard traderId={user.id} availableProduce={produces} onViewOrderTracking={(orderId) => {
          setTrackingOrderId(orderId);
          setActiveTab('order-tracking');
        }} onRegisterRefresh={(fn) => { dashboardRefreshRef.current = fn; }} /></div>;
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
          userRole={currentUser.type as 'farmer' | 'trader'} 
          onBack={() => setActiveTab('dashboard')}
          onOpenChat={(orderId, id, name) => setChatConfig({ orderId, otherUserId: id, otherUserName: name })} />;

      case 'schemes':
        return <GovernmentSchemes schemes={schemes} />;

      case 'traders':
        return (
          <TraderListingsForFarmers
            traders={traders}
            myProduce={[] /* Handled inside the component or fetch if needed */}
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
            <Header 
              userName={currentUser.name} 
              location={currentUser.location} 
              role={currentUser.type}
              unreadCount={unreadCount} 
              onLogout={handleLogout}
              onRefresh={handleRefresh}
            />
          )}

          <main className={`${!chatConfig && !showBidding && !showTransaction ? 'pt-4 pb-20' : 'pb-20 h-screen'}`}>
            {renderContent()}
          </main>

          {!chatConfig && !showBidding && !showTransaction && (
            <Navigation
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
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
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <ConnectivityBanner />
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;