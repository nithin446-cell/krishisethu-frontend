import React, { useState, useCallback } from 'react';
import { Bell, Globe, MapPin, LogOut, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  userName: string;
  location: string;
  role?: string;
  unreadCount?: number;
  onLogout?: () => void;
  onRefresh?: () => Promise<void> | void;
}

const Header: React.FC<HeaderProps> = ({ userName, location, role, unreadCount = 0, onLogout, onRefresh }) => {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Keep spin going for at least 600ms for visual feedback
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-b-xl shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {role === 'trader' ? t('dashboard.welcomeTrader') : t('dashboard.welcome')}, {userName}
          </h1>
          <div className="flex items-center mt-1">
            <MapPin size={16} className="mr-1" />
            <span className="text-sm opacity-90">{location}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-green-500 transition-colors">
            <Globe size={20} />
          </button>

          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-green-500 transition-colors disabled:opacity-60"
              title="Refresh dashboard"
            >
              <RefreshCw
                size={20}
                className={isRefreshing ? 'animate-spin' : 'transition-transform hover:rotate-180 duration-300'}
              />
            </button>
          )}

          <button className="relative p-2 rounded-full hover:bg-green-500 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-green-500 transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium hidden sm:block">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;