import React, { useState } from 'react';
import { Phone, User, Building, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginRegistrationProps {
  onLogin: (userType: 'farmer' | 'trader' | 'admin') => void;
}

const LoginRegistration: React.FC<LoginRegistrationProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'trader' | 'admin' | ''>('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      setStep('otp');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setStep('role');
    }
  };

  const handleRoleSubmit = () => {
    if (selectedRole) {
      onLogin(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-12">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Phone size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 'phone' && t('auth.enterMobile')}
            {step === 'otp' && t('auth.verifyOtp')}
            {step === 'role' && t('auth.selectRole')}
          </h2>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.enterMobile')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-4 flex items-center">
                  <span className="text-gray-500 mr-2">🇮🇳 +91</span>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full pl-20 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phoneNumber.length !== 10}
              className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
                phoneNumber.length === 10
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('auth.sendOtp')}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.verifyOtp')}
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Sent to +91 {phoneNumber}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-4 text-lg text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent tracking-widest"
                required
              />
            </div>

            <button
              type="submit"
              disabled={otp.length !== 6}
              className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
                otp.length === 6
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('auth.verifyOtpBtn')}
            </button>

            <button
              type="button"
              className="w-full py-2 text-green-600 hover:text-green-700 font-medium"
            >
              {t('auth.resendOtp')}
            </button>
          </form>
        )}

        {/* Role Selection Step */}
        {step === 'role' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <button
                onClick={() => setSelectedRole('farmer')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'farmer'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{t('auth.farmer')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('auth.farmerDesc')}</p>
                  </div>
                  {selectedRole === 'farmer' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('admin')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'admin'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield size={24} className="text-purple-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Admin</h3>
                    <p className="text-xs text-gray-500 mt-1">Platform Administrator</p>
                  </div>
                  {selectedRole === 'admin' && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={() => setSelectedRole('trader')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'trader'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building size={24} className="text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{t('auth.trader')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('auth.traderDesc')}</p>
                  </div>
                  {selectedRole === 'trader' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Admin Role - Hidden button for demo purposes */}
              <button
                onClick={() => setSelectedRole('admin')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === 'admin'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield size={24} className="text-purple-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Administrator</h3>
                    <p className="text-xs text-gray-500 mt-1">Platform administration access</p>
                  </div>
                  {selectedRole === 'admin' && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Verification Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Traders need APMC verification for platform access
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRoleSubmit}
              disabled={!selectedRole}
              className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
                selectedRole
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('common.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginRegistration;