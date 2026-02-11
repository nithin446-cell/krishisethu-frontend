import React from 'react';
import { Bell, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  userName: string;
  location: string;
  unreadCount?: number;
}

const Header: React.FC<HeaderProps> = ({ userName, location, unreadCount = 0 }) => {
  const { t } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-b-xl shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {t('dashboard.welcome').includes('Farmer') ? t('dashboard.welcome') : t('dashboard.welcomeTrader')}, {userName}
          </h1>
          <h1 className="text-xl font-bold">Hello, {userName}</h1>
          <div className="flex items-center mt-1">
            <MapPin size={16} className="mr-1" />
            <span className="text-sm opacity-90">{location}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-green-500 transition-colors">
            <Globe size={20} />
          </button>
          
          <button className="relative p-2 rounded-full hover:bg-green-500 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;