import React, { useEffect } from 'react';
import { Sprout, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-green-700 flex flex-col items-center justify-center p-6 text-white">
      {/* Logo and Brand */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
          <Sprout size={48} className="text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">KisanConnect</h1>
        <p className="text-lg opacity-90 font-medium">Direct Market Access for Farmers</p>
        <p className="text-sm opacity-75 mt-1">किसानों के लिए सीधा बाज़ार पहुंच</p>
      </div>

      {/* Illustration */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">👨‍🌾</span>
          </div>
          <p className="text-sm font-medium">Farmer</p>
          <p className="text-xs opacity-75">किसान</p>
        </div>
        
        <div className="flex flex-col items-center">
          <ArrowRight size={24} className="mb-2" />
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-lg">📱</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">🏪</span>
          </div>
          <p className="text-sm font-medium">Trader</p>
          <p className="text-xs opacity-75">व्यापारी</p>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>

      <p className="text-xs opacity-75 mt-4">Connecting farmers directly to markets</p>
    </div>
  );
};

export default SplashScreen;