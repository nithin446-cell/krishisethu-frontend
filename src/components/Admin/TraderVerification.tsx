import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Shield,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertTriangle,
  User
} from 'lucide-react';

interface TraderVerificationProps {
  onBack: () => void;
}

interface PendingTrader {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  location: string;
  applyDate: string;
  documents: {
    aadhar: string;
    pan: string;
    gst: string;
    apmc: string;
    bankStatement: string;
  };
  businessDetails: {
    type: string;
    experience: string;
    annualTurnover: string;
    references: string[];
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
}

const TraderVerification: React.FC<TraderVerificationProps> = ({ onBack }) => {
  const [selectedTrader, setSelectedTrader] = useState<PendingTrader | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review'>('pending');

  const [pendingTraders] = useState<PendingTrader[]>([
    {
      id: '1',
      name: 'Rajesh Kumar Gupta',
      businessName: 'Gupta Trading Company',
      phone: '+91-9876543210',
      email: 'rajesh@guptatrading.com',
      location: 'Mumbai APMC, Maharashtra',
      applyDate: '2024-01-20',
      documents: {
        aadhar: 'aadhar_rajesh.pdf',
        pan: 'pan_rajesh.pdf',
        gst: 'gst_certificate.pdf',
        apmc: 'apmc_license.pdf',
        bankStatement: 'bank_statement.pdf'
      },
      businessDetails: {
        type: 'Wholesale Trading',
        experience: '15 years',
        annualTurnover: '₹5 Crores',
        references: ['Sharma Enterprises', 'Patel Trading Co.']
      },
      status: 'pending'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      businessName: 'Sharma Agro Solutions',
      phone: '+91-9876543211',
      email: 'priya@sharmaagro.com',
      location: 'Delhi Mandi, Delhi',
      applyDate: '2024-01-18',
      documents: {
        aadhar: 'aadhar_priya.pdf',
        pan: 'pan_priya.pdf',
        gst: 'gst_certificate_priya.pdf',
        apmc: 'apmc_license_priya.pdf',
        bankStatement: 'bank_statement_priya.pdf'
      },
      businessDetails: {
        type: 'Retail & Wholesale',
        experience: '8 years',
        annualTurnover: '₹2.5 Crores',
        references: ['Kumar Trading', 'Agro Fresh Ltd.']
      },
      status: 'under_review'
    },
    {
      id: '3',
      name: 'Mohammed Ali',
      businessName: 'Ali Brothers Trading',
      phone: '+91-9876543212',
      email: 'ali@alibrothers.com',
      location: 'Hyderabad APMC, Telangana',
      applyDate: '2024-01-22',
      documents: {
        aadhar: 'aadhar_ali.pdf',
        pan: 'pan_ali.pdf',
        gst: 'gst_certificate_ali.pdf',
        apmc: 'apmc_license_ali.pdf',
        bankStatement: 'bank_statement_ali.pdf'
      },
      businessDetails: {
        type: 'Export Trading',
        experience: '12 years',
        annualTurnover: '₹8 Crores',
        references: ['Export House India', 'Global Agro Traders']
      },
      status: 'pending'
    }
  ]);

  const filteredTraders = pendingTraders.filter(trader => 
    filter === 'all' || trader.status === filter
  );

  const handleApprove = (traderId: string) => {
    console.log('Approving trader:', traderId);
    // In real app, this would call API to approve trader
    alert('Trader approved successfully!');
  };

  const handleReject = (traderId: string) => {
    console.log('Rejecting trader:', traderId);
    // In real app, this would call API to reject trader
    alert('Trader rejected. Reason will be sent via email.');
  };

  const handleViewDocument = (docName: string) => {
    console.log('Viewing document:', docName);
    // In real app, this would open document viewer
    alert(`Opening document: ${docName}`);
  };

  if (selectedTrader) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedTrader(null)} 
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-800">Trader Verification</h1>
              <p className="text-sm text-gray-600">{selectedTrader.name}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Trader Profile */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{selectedTrader.name}</h3>
                <p className="text-gray-600">{selectedTrader.businessName}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-500">Applied on {new Date(selectedTrader.applyDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTrader.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedTrader.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedTrader.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">{selectedTrader.phone}</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">{selectedTrader.email}</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">{selectedTrader.location}</span>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Business Details</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Business Type</p>
                <p className="font-semibold text-gray-800">{selectedTrader.businessDetails.type}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Experience</p>
                <p className="font-semibold text-gray-800">{selectedTrader.businessDetails.experience}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <p className="text-sm text-gray-600 mb-1">Annual Turnover</p>
                <p className="font-semibold text-gray-800">{selectedTrader.businessDetails.annualTurnover}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Business References</p>
              <div className="space-y-2">
                {selectedTrader.businessDetails.references.map((ref, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <Building size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{ref}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Submitted Documents</h4>
            
            <div className="space-y-3">
              {Object.entries(selectedTrader.documents).map(([docType, fileName]) => (
                <div key={docType} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800 capitalize">
                        {docType.replace(/([A-Z])/g, ' $1').trim()} Document
                      </p>
                      <p className="text-sm text-gray-500">{fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDocument(fileName)}
                      className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <Eye size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleViewDocument(fileName)}
                      className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <Download size={16} className="text-green-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Actions */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Verification Decision</h4>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Verification Checklist</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• All required documents submitted</li>
                  <li>• Business registration verified</li>
                  <li>• APMC license validated</li>
                  <li>• References contacted and verified</li>
                  <li>• Background check completed</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleReject(selectedTrader.id)}
                  className="flex items-center justify-center space-x-2 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  <XCircle size={20} />
                  <span>Reject Application</span>
                </button>
                
                <button
                  onClick={() => handleApprove(selectedTrader.id)}
                  className="flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={20} />
                  <span>Approve Trader</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">Trader Verification</h1>
          <p className="text-sm text-gray-600">Review and approve trader applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingTraders.filter(t => t.status === 'pending').length}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-blue-600">{pendingTraders.filter(t => t.status === 'under_review').length}</p>
          <p className="text-sm text-gray-600">Under Review</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-2xl font-bold text-green-600">24</p>
          <p className="text-sm text-gray-600">Approved</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'under_review', label: 'Under Review' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Traders List */}
      <div className="space-y-4">
        {filteredTraders.map((trader) => (
          <div 
            key={trader.id} 
            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTrader(trader)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{trader.name}</h3>
                  <p className="text-sm text-gray-600">{trader.businessName}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <MapPin size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-500">{trader.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-500">{new Date(trader.applyDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  trader.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  trader.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trader.status.replace('_', ' ')}
                </div>
                <Eye size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTraders.length === 0 && (
        <div className="text-center py-12">
          <Shield size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">No traders found</p>
          <p className="text-sm text-gray-400">No applications matching the selected filter</p>
        </div>
      )}
    </div>
  );
};

export default TraderVerification;