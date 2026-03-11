import React from 'react';
import { Home, Search, PlusCircle, User, Activity, FileText, ShieldAlert, TrendingUp, Landmark } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: 'farmer' | 'trader' | 'admin';
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, userType }) => {
  
  // Admin Navigation Bar
  if (userType === 'admin') {
    return (
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50 pb-safe">
        <NavItem 
          icon={<Home size={24} />} 
          label="Dashboard" 
          isActive={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')} 
        />
        <NavItem 
          icon={<ShieldAlert size={24} />} 
          label="Verification" 
          isActive={activeTab === 'verification'} 
          onClick={() => onTabChange('verification')} 
        />
        <NavItem 
          icon={<FileText size={24} />} 
          label="Disputes" 
          isActive={activeTab === 'disputes'} 
          onClick={() => onTabChange('disputes')} 
        />
        <NavItem 
          icon={<TrendingUp size={24} />} 
          label="Prices" 
          isActive={activeTab === 'prices'} 
          onClick={() => onTabChange('prices')} 
        />
        <NavItem 
          icon={<Landmark size={24} />} 
          label="Schemes" 
          isActive={activeTab === 'schemes'} 
          onClick={() => onTabChange('schemes')} 
        />
      </nav>
    );
  }

  // Farmer & Trader Navigation Bar
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50 pb-safe">
      {/* 1. Dashboard (Always visible) */}
      <NavItem 
        icon={<Home size={24} />} 
        label="Home" 
        isActive={activeTab === 'dashboard'} 
        onClick={() => onTabChange('dashboard')} 
      />

      {/* 2. Role-Specific Middle Buttons */}
      {userType === 'farmer' ? (
        <>
          <NavItem 
            icon={<PlusCircle size={24} />} 
            label="Sell" 
            isActive={activeTab === 'add'} 
            onClick={() => onTabChange('add')} 
          />
          <NavItem 
            icon={<Activity size={24} />} 
            label="Market" 
            isActive={activeTab === 'market'} 
            onClick={() => onTabChange('market')} 
          />
        </>
      ) : (
        <>
          <NavItem 
            icon={<Search size={24} />} 
            label="Browse" 
            isActive={activeTab === 'browse'} 
            onClick={() => onTabChange('browse')} 
          />
          <NavItem 
            icon={<Activity size={24} />} 
            label="Market" 
            isActive={activeTab === 'market'} 
            onClick={() => onTabChange('market')} 
          />
        </>
      )}

      {/* 3. Profile (Always visible for KYC and settings) */}
      <NavItem 
        icon={<User size={24} />} 
        label="Profile" 
        isActive={activeTab === 'profile'} 
        onClick={() => onTabChange('profile')} 
      />
    </nav>
  );
};

// Helper component for the individual buttons
const NavItem = ({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center space-y-1 transition-colors duration-200 ${
      isActive ? 'text-green-600' : 'text-gray-500 hover:text-green-500'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Navigation;