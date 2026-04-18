import React, { useState } from 'react';
import {
  ArrowLeft, Search, CheckCircle, Loader2, Shield,
  CreditCard, Building, AlertCircle, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface BankAccountSetupProps {
  userId: string;
  userRole: 'farmer' | 'trader';
  onComplete: () => void;
  onBack: () => void;
}

const INDIAN_BANKS = [
  { id: 'SBI',    name: 'State Bank of India',   ifscPrefix: 'SBIN', color: '#1a3c8f', popular: true },
  { id: 'HDFC',   name: 'HDFC Bank',              ifscPrefix: 'HDFC', color: '#004c8f', popular: true },
  { id: 'ICICI',  name: 'ICICI Bank',             ifscPrefix: 'ICIC', color: '#f37021', popular: true },
  { id: 'AXIS',   name: 'Axis Bank',              ifscPrefix: 'UTIB', color: '#97144D', popular: true },
  { id: 'KOTAK',  name: 'Kotak Mahindra Bank',    ifscPrefix: 'KKBK', color: '#cf2e2e', popular: true },
  { id: 'PNB',    name: 'Punjab National Bank',   ifscPrefix: 'PUNB', color: '#d4a017', popular: true },
  { id: 'CANARA', name: 'Canara Bank',            ifscPrefix: 'CNRB', color: '#006400', popular: false },
  { id: 'BOB',    name: 'Bank of Baroda',         ifscPrefix: 'BARB', color: '#f47920', popular: false },
  { id: 'UNION',  name: 'Union Bank of India',    ifscPrefix: 'UBIN', color: '#1c3f7c', popular: false },
  { id: 'IDBI',   name: 'IDBI Bank',              ifscPrefix: 'IBKL', color: '#003087', popular: false },
  { id: 'INDUS',  name: 'IndusInd Bank',          ifscPrefix: 'INDB', color: '#006eb6', popular: false },
  { id: 'YES',    name: 'Yes Bank',               ifscPrefix: 'YESB', color: '#00aeef', popular: false },
  { id: 'FEDERAL','name': 'Federal Bank',         ifscPrefix: 'FDRL', color: '#003087', popular: false },
  { id: 'IOB',    name: 'Indian Overseas Bank',   ifscPrefix: 'IOBA', color: '#004b87', popular: false },
  { id: 'UCO',    name: 'UCO Bank',               ifscPrefix: 'UCBA', color: '#1a6e3c', popular: false },
  { id: 'AIRTEL', name: 'Airtel Payments Bank',   ifscPrefix: 'AIRP', color: '#e40000', popular: false },
  { id: 'FINO',   name: 'Fino Payments Bank',     ifscPrefix: 'FINO', color: '#e87722', popular: false },
  { id: 'PAYTM',  name: 'Paytm Payments Bank',    ifscPrefix: 'PYTM', color: '#00baf2', popular: false },
];

type Step = 'select-bank' | 'enter-details' | 'verify-penny' | 'card-security' | 'success';

const BankAccountSetup: React.FC<BankAccountSetupProps> = ({ userId, userRole, onComplete, onBack }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('select-bank');
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<typeof INDIAN_BANKS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — account details
  const [accountDetails, setAccountDetails] = useState({
    account_holder_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    account_type: 'savings',
    upi_id: '',
    use_upi: false,
  });
  const [showAccNum, setShowAccNum] = useState(false);

  // Step 3 — penny drop
  const [pennyAmount, setPennyAmount] = useState('');
  const [pennyRef, setPennyRef] = useState('');

  // Step 4 — card security
  const [cardDetails, setCardDetails] = useState({
    last6: '',
    expiry_month: '',
    expiry_year: '',
  });

  // Saved linked account id from Razorpay
  const [linkedAccountId, setLinkedAccountId] = useState('');

  const filteredBanks = INDIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );
  const popularBanks = filteredBanks.filter(b => b.popular);
  const otherBanks = filteredBanks.filter(b => !b.popular);

  // ─── Step handlers ───────────────────────────────────────────────

  const handleBankSelect = (bank: typeof INDIAN_BANKS[0]) => {
    setSelectedBank(bank);
    setAccountDetails(prev => ({
      ...prev,
      ifsc_code: bank.ifscPrefix, // pre-fill prefix only
    }));
    setStep('enter-details');
    setError(null);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountDetails.use_upi) {
      if (accountDetails.account_number !== accountDetails.confirm_account_number) {
        setError(t('bank.errorMismatch'));
        return;
      }
      if (accountDetails.ifsc_code.length !== 11) {
        setError(t('bank.errorIfsc'));
        return;
      }
    } else {
      if (!accountDetails.upi_id.includes('@')) {
        setError(t('bank.errorUpi'));
        return;
      }
    }

    setLoading(true);
    try {
      // Initiate penny drop — backend sends ₹1 to this account
      const res = await api.initiatePennyDrop({
        user_id: userId,
        bank_id: selectedBank!.id,
        account_holder_name: accountDetails.account_holder_name,
        account_number: accountDetails.use_upi ? undefined : accountDetails.account_number,
        ifsc_code: accountDetails.use_upi ? undefined : accountDetails.ifsc_code,
        upi_id: accountDetails.use_upi ? accountDetails.upi_id : undefined,
        account_type: accountDetails.account_type,
      });
      setPennyRef(res.reference_id);
      setStep('verify-penny');
    } catch (err: any) {
      setError(err.message || t('bank.errorInitiate'));
    } finally {
      setLoading(false);
    }
  };

  const handlePennyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.verifyPennyDrop({
        reference_id: pennyRef,
        entered_amount: parseFloat(pennyAmount),
      });
      setStep('card-security');
    } catch (err: any) {
      setError(err.message || t('bank.errorAmount'));
    } finally {
      setLoading(false);
    }
  };

  const handleCardVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cardDetails.last6.length !== 6) {
      setError(t('bank.errorCard'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerBankWithRazorpay({
        user_id: userId,
        role: userRole,
        reference_id: pennyRef,
        card_last6: cardDetails.last6,
        card_expiry_month: cardDetails.expiry_month,
        card_expiry_year: cardDetails.expiry_year,
      });
      setLinkedAccountId(res.linked_account_id || '');
      setStep('success');
    } catch (err: any) {
      setError(err.message || t('bank.errorCardVerify'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  const StepIndicator = () => {
    const steps = ['Bank', 'Details', 'Verify', 'Security'];
    const current = ['select-bank','enter-details','verify-penny','card-security','success'].indexOf(step);
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i < current ? 'bg-green-600 text-white' :
              i === current ? 'bg-indigo-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 ${i < current ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      {step !== 'success' && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
          <button onClick={step === 'select-bank' ? onBack : () => {
            if (step === 'enter-details') setStep('select-bank');
            if (step === 'verify-penny') setStep('enter-details');
            if (step === 'card-security') setStep('verify-penny');
          }} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{t('bank.addAccount')}</h1>
            <p className="text-xs text-gray-500">
              {step === 'select-bank' && t('bank.chooseBank')}
              {step === 'enter-details' && `${selectedBank?.name} — ${t('bank.enterDetails')}`}
              {step === 'verify-penny' && t('bank.verifyAccount')}
              {step === 'card-security' && t('bank.securityCheck')}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto">
        {step !== 'select-bank' && step !== 'success' && <StepIndicator />}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── STEP 1: Select Bank ── */}
        {step === 'select-bank' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={t('bank.searchBank')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            {popularBanks.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('bank.popularBanks')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {popularBanks.map(bank => (
                    <button key={bank.id} onClick={() => handleBankSelect(bank)}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: bank.color }}>
                        {bank.id.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{bank.id}</p>
                        <p className="text-xs text-gray-500 truncate">{bank.name.split(' ').slice(0, 2).join(' ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {otherBanks.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">{t('bank.allBanks')}</p>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {otherBanks.map((bank, i) => (
                    <button key={bank.id} onClick={() => handleBankSelect(bank)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                        i < otherBanks.length - 1 ? 'border-b border-gray-100' : ''
                      }`}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: bank.color }}>
                        {bank.id.slice(0, 2)}
                      </div>
                      <p className="text-sm font-medium text-gray-800 flex-1">{bank.name}</p>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 2: Enter Details ── */}
        {step === 'enter-details' && selectedBank && (
          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            {/* Bank badge */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selectedBank.color }}>
                {selectedBank.id.slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedBank.name}</p>
                <p className="text-xs text-gray-500">{t('bank.selectedBank')}</p>
              </div>
            </div>

            {/* Toggle UPI vs Account Number */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button type="button"
                onClick={() => setAccountDetails(prev => ({ ...prev, use_upi: false }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !accountDetails.use_upi ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
                }`}>
                {t('bank.accountNumber')}
              </button>
              <button type="button"
                onClick={() => setAccountDetails(prev => ({ ...prev, use_upi: true }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  accountDetails.use_upi ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
                }`}>
                UPI ID
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank.accountHolder')} *</label>
              <input required type="text"
                value={accountDetails.account_holder_name}
                onChange={e => setAccountDetails(prev => ({ ...prev, account_holder_name: e.target.value }))}
                placeholder={t('bank.accountHolder')}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>

            {!accountDetails.use_upi ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank.accountNumber')} *</label>
                  <div className="relative">
                    <input required
                      type={showAccNum ? 'text' : 'password'}
                      value={accountDetails.account_number}
                      onChange={e => setAccountDetails(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                      placeholder={t('bank.accountNumber')}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                    <button type="button" onClick={() => setShowAccNum(!showAccNum)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                      {showAccNum ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank.confirmAccountNumber')} *</label>
                  <input required type="text"
                    value={accountDetails.confirm_account_number}
                    onChange={e => setAccountDetails(prev => ({ ...prev, confirm_account_number: e.target.value.replace(/\D/g, '') }))}
                    placeholder={t('bank.confirmAccountNumber')}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank.ifscCode')} *</label>
                  <input required type="text" maxLength={11}
                    value={accountDetails.ifsc_code}
                    onChange={e => setAccountDetails(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank.accountType')} *</label>
                  <div className="flex gap-3">
                    {['savings', 'current'].map(type => (
                      <button key={type} type="button"
                        onClick={() => setAccountDetails(prev => ({ ...prev, account_type: type }))}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          accountDetails.account_type === type
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {t(`bank.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID *</label>
                <input required type="text"
                  value={accountDetails.upi_id}
                  onChange={e => setAccountDetails(prev => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="e.g. name@okicici or 9876543210@upi"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{t('bank.verifyBenefit')}</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Building size={20} />}
              {loading ? t('common.processing') || 'Processing...' : t('bank.verifyMyAccount')}
            </button>
          </form>
        )}

        {/* ── STEP 3: Penny Drop Verification ── */}
        {step === 'verify-penny' && (
          <form onSubmit={handlePennyVerify} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">₹</span>
              </div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">Check Your Bank Account</h3>
              <p className="text-sm text-amber-700">We sent a small amount (₹0.50 – ₹1.00) to your account. Check your bank SMS or statement and enter the exact amount below.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount received in your account (₹) *</label>
              <input required type="number" step="0.01" min="0" max="2"
                value={pennyAmount}
                onChange={e => setPennyAmount(e.target.value)}
                placeholder="e.g. 0.50 or 1.00"
                className="w-full p-4 text-lg text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
              <p className="text-xs text-gray-400 mt-1 text-center">Check SMS from your bank — amount is between ₹0.50 and ₹1.00</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Where to check:</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                SMS from your bank (e.g. "Credit of ₹1.00 to account XXXX1234")
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                Net banking / mobile banking mini statement
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                UPI app transaction history
              </div>
            </div>

            <button type="submit" disabled={loading || !pennyAmount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {loading ? 'Verifying...' : 'Confirm Amount'}
            </button>
          </form>
        )}

        {/* ── STEP 4: Card Security ── */}
        {step === 'card-security' && (
          <form onSubmit={handleCardVerify} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Debit Card Security Check</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your debit card details linked to this bank account. This ensures only you can register this account.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700">
                  Your card details are encrypted and verified directly with your bank.
                  We never store your full card number. This is a one-time verification step.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last 6 digits of Debit Card *</label>
              <input required type="text" maxLength={6}
                value={cardDetails.last6}
                onChange={e => setCardDetails(prev => ({ ...prev, last6: e.target.value.replace(/\D/g, '') }))}
                placeholder="e.g. 123456"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono tracking-widest text-center text-lg" />
              <p className="text-xs text-gray-400 mt-1 text-center">The last 6 digits printed on the front of your card</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Expiry Date *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input required type="text" maxLength={2}
                     value={cardDetails.expiry_month}
                    onChange={e => setCardDetails(prev => ({ ...prev, expiry_month: e.target.value.replace(/\D/g, '') }))}
                    placeholder="MM"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-center text-lg" />
                  <p className="text-xs text-gray-400 mt-1 text-center">Month</p>
                </div>
                <div>
                  <input required type="text" maxLength={4}
                    value={cardDetails.expiry_year}
                    onChange={e => setCardDetails(prev => ({ ...prev, expiry_year: e.target.value.replace(/\D/g, '') }))}
                    placeholder="YYYY"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-center text-lg" />
                  <p className="text-xs text-gray-400 mt-1 text-center">Year</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs text-green-700 font-medium mb-1">Account verified successfully ✓</p>
              <p className="text-xs text-green-600">One last step — debit card confirmation for security.</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
              {loading ? 'Registering account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 'success' && (
          <div className="text-center py-10 space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('bank.successTitle')}</h2>
              <p className="text-gray-500 text-sm">
                {t('bank.successDesc')}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank</span>
                <span className="font-semibold text-gray-800">{selectedBank?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account Holder</span>
                <span className="font-semibold text-gray-800">{accountDetails.account_holder_name}</span>
              </div>
              {!accountDetails.use_upi && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account Number</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {'*'.repeat(Math.max(0, accountDetails.account_number.length - 4)) +
                      accountDetails.account_number.slice(-4)}
                  </span>
                </div>
              )}
              {accountDetails.use_upi && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">UPI ID</span>
                  <span className="font-semibold text-gray-800">{accountDetails.upi_id}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle size={14} /> Verified
                </span>
              </div>
            </div>

            <button onClick={onComplete}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg">
              {t('bank.continueDashboard')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccountSetup;
