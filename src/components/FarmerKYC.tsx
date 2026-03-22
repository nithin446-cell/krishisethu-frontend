import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle, Shield,
  Camera, Upload, Eye, EyeOff, RefreshCw, UserCheck,
  FileText, Smartphone, ChevronRight, Clock
} from 'lucide-react';
import { api } from '../lib/api';

interface FarmerKYCProps {
  userId: string;
  userName: string;
  onComplete: () => void;
  onBack: () => void;
}

type Step = 'intro' | 'pan' | 'aadhaar-entry' | 'aadhaar-otp' | 'selfie' | 'review' | 'submitted';
type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

const FarmerKYC: React.FC<FarmerKYCProps> = ({ userId, userName, onComplete, onBack }) => {
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>('not_started');

  // PAN state
  const [pan, setPan] = useState('');
  const [panName, setPanName] = useState('');
  const [panDob, setPanDob] = useState('');
  const [panVerified, setPanVerified] = useState(false);
  const [panData, setPanData] = useState<any>(null);

  // Aadhaar state
  const [aadhaar, setAadhaar] = useState('');
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aadhaarClientId, setAadhaarClientId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [aadhaarData, setAadhaarData] = useState<any>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Selfie state
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [aadhaarDocFile, setAadhaarDocFile] = useState<File | null>(null);
  const [aadhaarDocPreview, setAadhaarDocPreview] = useState<string | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  // Check existing KYC status on mount
  useEffect(() => {
    api.getKYCStatus().then((res: any) => {
      if (res?.status === 'approved') { setKycStatus('approved'); setStep('submitted'); }
      else if (res?.status === 'pending') { setKycStatus('pending'); setStep('submitted'); }
      else if (res?.status === 'rejected') { setKycStatus('rejected'); }
    }).catch(() => {});
  }, []);

  const clearError = () => setError(null);

  // ── PAN verification ──────────────────────────────────────────
  const handlePanVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (pan.length !== 10) { setError('PAN must be exactly 10 characters.'); return; }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(pan.toUpperCase())) { setError('Invalid PAN format. Example: ABCDE1234F'); return; }

    setLoading(true);
    try {
      const res = await api.verifyPAN({ pan: pan.toUpperCase(), name: panName, dob: panDob });
      setPanData(res);
      setPanVerified(true);
      setTimeout(() => setStep('aadhaar-entry'), 1200);
    } catch (err: any) {
      setError(err.message || 'PAN verification failed. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Aadhaar OTP send ─────────────────────────────────────────
  const handleAadhaarSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const raw = aadhaar.replace(/\s/g, '');
    if (raw.length !== 12) { setError('Aadhaar number must be 12 digits.'); return; }

    setLoading(true);
    try {
      const res = await api.sendAadhaarOtp({ aadhaar: raw });
      setAadhaarClientId(res.client_id);
      setOtpTimer(60);
      setStep('aadhaar-otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Check Aadhaar number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Aadhaar OTP verify ────────────────────────────────────────
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Enter the complete 6-digit OTP.'); return; }

    setLoading(true);
    try {
      const res = await api.verifyAadhaarOtp({ client_id: aadhaarClientId, otp: otpStr });
      setAadhaarData(res);
      setStep('selfie');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Selfie / doc upload ───────────────────────────────────────
  const handleFileSelect = (file: File, type: 'selfie' | 'doc') => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG).'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    const url = URL.createObjectURL(file);
    if (type === 'selfie') { setSelfieFile(file); setSelfiePreview(url); }
    else { setAadhaarDocFile(file); setAadhaarDocPreview(url); }
    clearError();
  };

  // ── Final submission ─────────────────────────────────────────
  const handleSubmitKYC = async () => {
    clearError();
    if (!selfieFile) { setError('Please upload your selfie.'); return; }
    if (!aadhaarDocFile) { setError('Please upload your Aadhaar card photo.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', selfieFile);
      formData.append('aadhaar_doc', aadhaarDocFile);
      formData.append('pan', pan.toUpperCase());
      formData.append('aadhaar_client_id', aadhaarClientId);
      formData.append('pan_name', panData?.full_name || panName);
      formData.append('dob', panData?.dob || panDob);
      await api.submitKYC(formData);
      setKycStatus('pending');
      setStep('submitted');
    } catch (err: any) {
      setError(err.message || 'KYC submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Format Aadhaar with spaces ────────────────────────────────
  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // ── Step indicator ────────────────────────────────────────────
  const steps = ['PAN', 'Aadhaar', 'Selfie', 'Done'];
  const stepIdx = { pan: 0, 'aadhaar-entry': 1, 'aadhaar-otp': 1, selfie: 2, review: 2, submitted: 3 };
  const currentStepIdx = stepIdx[step as keyof typeof stepIdx] ?? -1;

  const StepBar = () => (
    <div className="flex items-center justify-center gap-2 mb-6 pt-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
            i < currentStepIdx ? 'bg-green-600 text-white' :
            i === currentStepIdx ? 'bg-orange-500 text-white shadow-md' :
            'bg-gray-100 text-gray-400'
          }`}>
            {i < currentStepIdx ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-10 transition-all ${i < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      {step !== 'submitted' && (
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={step === 'intro' || step === 'pan' ? onBack : () => {
            if (step === 'aadhaar-entry') setStep('pan');
            if (step === 'aadhaar-otp') setStep('aadhaar-entry');
            if (step === 'selfie') setStep('aadhaar-entry');
            if (step === 'review') setStep('selfie');
          }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">KYC Verification</h1>
            <p className="text-xs text-gray-500">Required to receive payments</p>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
            <Shield size={12} className="text-orange-500" />
            <span className="text-xs text-orange-700 font-medium">Secure</span>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-base leading-none">✕</button>
          </div>
        )}

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <UserCheck size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">Complete Your KYC</h2>
              <p className="text-orange-100 text-sm leading-relaxed">
                As per RBI regulations, identity verification is required before you can receive payments above ₹50,000/year.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
              {[
                { icon: <FileText size={18} className="text-blue-500" />, title: 'PAN card verification', desc: 'Your PAN number + name as on card', time: '1 min' },
                { icon: <Smartphone size={18} className="text-green-500" />, title: 'Aadhaar OTP verification', desc: 'OTP sent to Aadhaar-linked mobile', time: '2 min' },
                { icon: <Camera size={18} className="text-purple-500" />, title: 'Selfie + Aadhaar photo', desc: 'Clear photo of you and your Aadhaar card', time: '1 min' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Your data is encrypted and shared only with Razorpay for payment processing. It is never sold or shared with third parties.
              </p>
            </div>

            <button onClick={() => setStep('pan')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors">
              Start Verification <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── PAN ── */}
        {step === 'pan' && (
          <form onSubmit={handlePanVerify} className="space-y-5">
            <StepBar />

            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={26} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">PAN Card Verification</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your details exactly as on your PAN card</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name (as on PAN) *</label>
                <input required type="text"
                  value={panName}
                  onChange={e => setPanName(e.target.value.toUpperCase())}
                  placeholder="e.g. RAJESH KUMAR SHARMA"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-mono tracking-wide uppercase bg-gray-50 focus:bg-white transition-colors" />
                <p className="text-xs text-gray-400 mt-1">Use capital letters, exactly as printed on card</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">PAN Number *</label>
                <input required type="text" maxLength={10}
                  value={pan}
                  onChange={e => setPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-mono tracking-widest uppercase bg-gray-50 focus:bg-white transition-colors" />
                <p className="text-xs text-gray-400 mt-1">10-character alphanumeric code</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth *</label>
                <input required type="date"
                  value={panDob}
                  onChange={e => setPanDob(e.target.value)}
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
              </div>
            </div>

            {panVerified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">PAN Verified!</p>
                  <p className="text-xs text-green-600">{panData?.full_name} · {panData?.dob}</p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Make sure your name matches exactly — mismatches will fail verification.</p>
            </div>

            <button type="submit" disabled={loading || panVerified}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              {loading ? 'Verifying PAN...' : panVerified ? 'PAN Verified ✓' : 'Verify PAN'}
            </button>
          </form>
        )}

        {/* ── AADHAAR ENTRY ── */}
        {step === 'aadhaar-entry' && (
          <form onSubmit={handleAadhaarSendOtp} className="space-y-5">
            <StepBar />

            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={26} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Aadhaar Verification</h2>
              <p className="text-sm text-gray-500 mt-1">An OTP will be sent to your Aadhaar-linked mobile number</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aadhaar Number *</label>
              <div className="relative">
                <input required
                  type={showAadhaar ? 'text' : 'password'}
                  value={aadhaar}
                  onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none text-base font-mono tracking-widest bg-gray-50 focus:bg-white transition-colors" />
                <button type="button" onClick={() => setShowAadhaar(!showAadhaar)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showAadhaar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">12-digit number on your Aadhaar card</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-800">Important</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• OTP will be sent to the mobile number registered with UIDAI</p>
                <p>• If your mobile is not linked, update it at your nearest Aadhaar centre first</p>
                <p>• OTP is valid for 10 minutes</p>
              </div>
            </div>

            <button type="submit" disabled={loading || aadhaar.replace(/\s/g, '').length !== 12}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Smartphone size={20} />}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ── AADHAAR OTP ── */}
        {step === 'aadhaar-otp' && (
          <form onSubmit={handleOtpVerify} className="space-y-5">
            <StepBar />

            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📱</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Enter OTP</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sent to Aadhaar-linked number ending in{' '}
                <span className="font-semibold text-gray-700">
                  ··{aadhaar.replace(/\s/g, '').slice(-2)}
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-center gap-3 mb-4" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                      digit ? 'border-green-500 bg-green-50 text-green-800' :
                      'border-gray-200 bg-gray-50 text-gray-800'
                    } focus:border-green-500 focus:bg-white`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                {otpTimer > 0 ? (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} /> Resend in {otpTimer}s
                  </p>
                ) : (
                  <button type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await api.sendAadhaarOtp({ aadhaar: aadhaar.replace(/\s/g, '') });
                        setAadhaarClientId(res.client_id);
                        setOtpTimer(60);
                        setOtp(['','','','','','']);
                        clearError();
                      } catch (err: any) { setError(err.message); }
                      finally { setLoading(false); }
                    }}
                    className="text-sm text-green-600 font-semibold flex items-center gap-1 hover:text-green-700">
                    <RefreshCw size={14} /> Resend OTP
                  </button>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading || otp.join('').length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button type="button" onClick={() => setStep('aadhaar-entry')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
              Wrong number? Go back
            </button>
          </form>
        )}

        {/* ── SELFIE + AADHAAR DOC ── */}
        {step === 'selfie' && (
          <div className="space-y-5">
            <StepBar />

            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Camera size={26} className="text-purple-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Upload Photos</h2>
              <p className="text-sm text-gray-500 mt-1">Clear photos in good lighting — blurry images will be rejected</p>
            </div>

            {/* Selfie upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Camera size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Your Selfie *</p>
                  <p className="text-xs text-gray-500">Face clearly visible, no glasses, good lighting</p>
                </div>
              </div>
              <input ref={selfieInputRef} type="file" accept="image/*" capture="user"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'selfie'); }} />
              {selfiePreview ? (
                <div className="relative">
                  <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover rounded-xl" />
                  <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Uploaded
                  </div>
                </div>
              ) : (
                <button onClick={() => selfieInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-colors group">
                  <Upload size={24} className="text-purple-400 group-hover:text-purple-600" />
                  <span className="text-sm text-purple-500 font-medium">Tap to take selfie</span>
                  <span className="text-xs text-gray-400">or upload from gallery</span>
                </button>
              )}
            </div>

            {/* Aadhaar doc upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <FileText size={16} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Aadhaar Card Photo *</p>
                  <p className="text-xs text-gray-500">Front side, all text clearly readable</p>
                </div>
              </div>
              <input ref={docInputRef} type="file" accept="image/*"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'doc'); }} />
              {aadhaarDocPreview ? (
                <div className="relative">
                  <img src={aadhaarDocPreview} alt="Aadhaar" className="w-full h-36 object-cover rounded-xl" />
                  <button onClick={() => { setAadhaarDocFile(null); setAadhaarDocPreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Uploaded
                  </div>
                </div>
              ) : (
                <button onClick={() => docInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition-colors group">
                  <Upload size={22} className="text-orange-400 group-hover:text-orange-600" />
                  <span className="text-sm text-orange-500 font-medium">Upload Aadhaar front side</span>
                </button>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Tips for a successful upload</p>
              <div className="text-xs text-gray-500 grid grid-cols-2 gap-1">
                <p>✓ Bright, even lighting</p>
                <p>✓ All 4 corners visible</p>
                <p>✓ No glare or shadow</p>
                <p>✓ Min 200KB file size</p>
              </div>
            </div>

            <button onClick={handleSubmitKYC}
              disabled={loading || !selfieFile || !aadhaarDocFile}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
              {loading ? 'Submitting KYC...' : 'Submit KYC'}
            </button>
          </div>
        )}

        {/* ── SUBMITTED / STATUS ── */}
        {step === 'submitted' && (
          <div className="text-center py-10 space-y-6">
            {kycStatus === 'approved' ? (
              <>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">KYC Approved!</h2>
                  <p className="text-gray-500 text-sm mt-2">You can now receive unlimited payments directly to your bank account.</p>
                </div>
                <button onClick={onComplete}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors">
                  Back to Dashboard
                </button>
              </>
            ) : kycStatus === 'rejected' ? (
              <>
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={48} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                  <p className="text-gray-500 text-sm mt-2">Your KYC was rejected. Please check your documents and try again.</p>
                </div>
                <button onClick={() => { setStep('pan'); setKycStatus('not_started'); clearError(); }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors">
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock size={48} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">KYC Submitted!</h2>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    Your documents are under review. This usually takes <strong>15 minutes to 2 hours</strong>.
                    You'll receive an SMS once approved.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
                  <p className="text-sm font-bold text-amber-800">While you wait</p>
                  {[
                    'Continue listing your produce',
                    'You can accept bids immediately',
                    'Payments will be released after KYC approval',
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-amber-700">
                      <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">{i + 1}</div>
                      {t}
                    </div>
                  ))}
                </div>
                <button onClick={onComplete}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors">
                  Back to Dashboard
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerKYC;
