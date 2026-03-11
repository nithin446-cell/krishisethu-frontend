import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, XCircle, CheckCircle, FileText, Loader2, User } from 'lucide-react';
import { api } from '../../lib/api';

const TraderVerification = ({ onBack }: { onBack: () => void }) => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVerifications = async () => {
    try {
      const data = await api.getPendingVerifications();
      setPendingUsers(Array.isArray(data) ? data : (data?.data || []));
    } catch (error: any) {
      console.error("Failed to fetch verifications:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (userId: string, status: 'verified' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this user as ${status.toUpperCase()}?`)) return;

    setActionLoading(userId);
    try {
      await api.updateVerificationStatus(userId, status);
      alert(`User successfully ${status}!`);
      fetchVerifications(); 
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-500 text-sm">Review uploaded ID documents for Farmers and Traders</p>
        </div>
      </div>

      <div className="space-y-4">
        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <ShieldCheck size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">All Caught Up!</h3>
            <p className="text-gray-500">There are no pending KYC verifications right now.</p>
          </div>
        ) : (
          pendingUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                
                {/* User Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">{user.full_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user.role === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 pl-7">
                    <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                    <p><strong>Location:</strong> {user.location || 'N/A'}</p>
                    {user.business_name && <p><strong>Business:</strong> {user.business_name}</p>}
                    <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Document View - Supports Multiple Uploads */}
                <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <FileText size={16} className="mr-2 text-gray-500" />
                    Document: {user.document_type || 'Unknown ID'}
                  </p>
                  
                  {user.document_url ? (
                    <div className="space-y-2 mt-2">
                      {user.document_url.split(',').map((url: string, index: number) => (
                        <a 
                          key={index} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full text-center py-2 px-4 bg-indigo-100 text-indigo-700 font-medium rounded text-sm hover:bg-indigo-200 transition"
                        >
                          View Uploaded Image {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 italic">No document links found.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 min-w-[150px]">
                  <button 
                    onClick={() => handleAction(user.id, 'verified')}
                    disabled={actionLoading === user.id}
                    className="flex items-center justify-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    <CheckCircle size={16} className="mr-2" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(user.id, 'rejected')}
                    disabled={actionLoading === user.id}
                    className="flex items-center justify-center py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TraderVerification;