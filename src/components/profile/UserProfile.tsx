import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Shield, Upload, Loader2, CheckCircle, Clock, Key, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const UserProfile = ({ userId, initialUser }: { userId: string, initialUser: any }) => {
  const [liveUser, setLiveUser] = useState<any>(initialUser);
  const [documentType, setDocumentType] = useState('Aadhaarcard (Basic verification)');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Password Change States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) throw error;
        setLiveUser(data);
        
        // Default dropdown selection based on role
        if (data.role === 'trader') setDocumentType('Aadhaar card / PAN Card');
      } catch (err) {
        console.error("Error fetching live user:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Please select at least one document image to upload.");

    setLoading(true);
    const formData = new FormData();
    formData.append('document_type', documentType);
    files.forEach(file => formData.append('documents', file)); 

    try {
      await api.uploadKYC(formData);
      alert("Documents submitted successfully! Waiting for Admin approval.");
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      setLiveUser(data);
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords do not match!");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters long.");

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      alert("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      alert("Failed to update password: " + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600" /></div>;

  const status = liveUser.verification_status || 'unverified';

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${status === 'verified' ? 'bg-green-500' : status === 'pending_verification' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="text-white text-2xl font-bold">{liveUser.full_name?.charAt(0) || 'U'}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center">
          {liveUser.full_name}
          {status === 'verified' && <ShieldCheck size={20} className="text-green-500 ml-2" />}
        </h3>
        <p className="text-gray-500 text-sm capitalize">{liveUser.role} • {liveUser.location}</p>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-indigo-600" /> Trust & Verification (KYC)
        </h3>

        {status === 'verified' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start">
            <CheckCircle className="text-green-600 mr-3 mt-0.5 shrink-0" size={24} />
            <div>
              <p className="font-bold text-green-800">Account Verified</p>
              <p className="text-sm text-green-700 mt-1">Your identity has been verified. You have full access to trade.</p>
            </div>
          </div>
        )}

        {status === 'pending_verification' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
            <Clock className="text-yellow-600 mr-3 mt-0.5 shrink-0" size={24} />
            <div>
              <p className="font-bold text-yellow-800">Verification Pending</p>
              <p className="text-sm text-yellow-700 mt-1">Your document ({liveUser.document_type}) is currently being reviewed by an Admin.</p>
            </div>
          </div>
        )}

        {(status === 'unverified' || status === 'rejected') && (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className={`bg-red-50 border border-red-200 p-4 rounded-lg flex items-start mb-4`}>
              <ShieldAlert className="text-red-600 mr-3 mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-bold text-red-800">Account Unverified</p>
                <p className="text-sm text-red-700 mt-1">
                  {status === 'rejected' ? "Your previous document was rejected. Please upload a clear, valid ID." : "Upload required documents to unlock the marketplace."}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Document Type</label>
              <select 
                value={documentType} 
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
              >
                {liveUser.role === 'farmer' ? (
                  <>
                    <option value="Aadhaarcard (Basic verification)">Aadhaarcard (Basic verification)</option>
                    <option value="Kisan Credit Card [KCC]">Kisan Credit Card [KCC]</option>
                    <option value="Land holding Pass book / Patta">Land holding Pass book / Patta</option>
                  </>
                ) : (
                  <>
                    <option value="Aadhaar card / PAN Card">Aadhaar card / PAN Card</option>
                    <option value="GSTIN Certificate & Trader License / Udyam card">GSTIN Certificate & Trader License / Udyam card</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo(s) of Document</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="hidden" 
                  id="kyc-upload" 
                />
                <label htmlFor="kyc-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-indigo-600">Click to upload images</span>
                  <span className="text-xs text-gray-500 mt-1">{files.length > 0 ? `${files.length} file(s) selected` : 'Upload front and back if needed'}</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading || files.length === 0} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center">
              {loading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
              Submit Document for KYC
            </button>
          </form>
        )}
      </div>

      {/* Extra User Details & Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-3">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Account Details</h3>
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600 text-sm">Phone Number</span>
          <span className="font-medium text-sm text-gray-900">{liveUser.phone || 'Not provided'}</span>
        </div>
        {liveUser.business_name && (
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600 text-sm">Business Name</span>
            <span className="font-medium text-sm text-gray-900">{liveUser.business_name}</span>
          </div>
        )}

        <div className="pt-4">
          <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
            <Key size={16} className="mr-2" />
            {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Enter new password" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Confirm new password" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <button type="submit" disabled={passwordLoading || !newPassword || !confirmPassword} className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-sm font-semibold flex justify-center items-center transition disabled:opacity-50">
                {passwordLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Key size={16} className="mr-2" />}
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;