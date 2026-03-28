import React, { useState } from 'react';
import { Mail, Lock, User, Building, Phone as PhoneIcon, MapPin, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../lib/contexts/AuthContext';

interface LoginRegistrationProps {
  // We'll just trigger this when auth is completely successful
  onLogin: () => void; 
}

const LoginRegistration: React.FC<LoginRegistrationProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const { login, signup, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [step, setStep] = useState<'role' | 'details'>('role'); // Only used for signup
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'trader' | ''>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setSuccessMsg(null);
    try {
      await login(email, password);
      onLogin(); // Tell App.tsx to switch to the main dashboard
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setSuccessMsg(null);
    try {
      await signup({
        email,
        password,
        full_name: name,
        phone,
        location,
        role: selectedRole,
        business_name: businessName
      });
      onLogin(); // Tell App.tsx to switch to the main dashboard
    } catch (err: any) {
      console.error('Signup failed:', err);
      setAuthError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setSuccessMsg(null);
    try {
      await resetPassword(email);
      setSuccessMsg('Password reset link sent! Please check your email.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Header Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
          <button
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${mode === 'login' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setMode('login'); setAuthError(null); setSuccessMsg(null); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${mode === 'signup' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setMode('signup'); setAuthError(null); setSuccessMsg(null); setStep('role'); }}
          >
            Sign Up
          </button>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-6 flex items-start gap-2">
            <span>⚠️</span>
            <span>{authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm mb-6 flex items-start gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= LOGIN MODE ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={() => { setMode('forgot'); setAuthError(null); setSuccessMsg(null); }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors flex justify-center items-center ${isLoading || !email || !password ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'}`}
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Log In'}
            </button>

            {/* NEW: Create Account Link at the bottom */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setMode('signup'); setAuthError(null); setSuccessMsg(null); setStep('role'); }}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Create new account
              </button>
            </p>
          </form>
        )}

        {/* ================= FORGOT PASSWORD MODE ================= */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="flex items-center gap-2 mb-6">
              <button type="button" onClick={() => { setMode('login'); setAuthError(null); setSuccessMsg(null); }} className="text-gray-400 hover:text-gray-600">← Back</button>
              <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter your email address and we'll send you a link to reset your password.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors flex justify-center items-center ${isLoading || !email ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'}`}
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* ================= SIGNUP MODE ================= */}
        {mode === 'signup' && step === 'role' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Choose Your Role</h2>
              <p className="text-gray-500 text-sm mt-1">How will you use Krishisethu?</p>
            </div>

            {/* Role Cards */}
            {['farmer', 'trader'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role as any)}
                className={`w-full p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  selectedRole === role ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  role === 'farmer' ? 'bg-green-100 text-green-600' : role === 'trader' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {role === 'farmer' ? <User size={24} /> : role === 'trader' ? <Building size={24} /> : <Shield size={24} />}
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">{role}</h3>
                  <p className="text-xs text-gray-500">
                    {role === 'farmer' ? 'List your produce to sell' : role === 'trader' ? 'Bid on farmer listings' : 'Manage the platform'}
                  </p>
                </div>
              </button>
            ))}

            <button
              onClick={() => setStep('details')}
              disabled={!selectedRole}
              className={`w-full py-4 rounded-xl text-lg font-semibold mt-4 transition-colors ${!selectedRole ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'}`}
            >
              Continue
            </button>
          </div>
        )}

        {mode === 'signup' && step === 'details' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <button type="button" onClick={() => setStep('role')} className="text-gray-400 hover:text-gray-600">← Back</button>
              <h2 className="text-xl font-bold text-gray-800">Complete Profile</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="John Doe" />
              </div>
            </div>

            {selectedRole === 'trader' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Doe Trading Co." />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="98765..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="City, State" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Email for login" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Min 6 characters" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 mt-2 rounded-xl text-lg font-semibold transition-colors flex justify-center items-center ${isLoading ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'}`}
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginRegistration;