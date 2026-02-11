import React from 'react';
import { Users, Shield, TriangleAlert as AlertTriangle, TrendingUp, FileText, DollarSign, Eye } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const stats = [
    { title: 'Total Users', value: 1247, icon: Users, change: '+12%' },
    { title: 'Pending Verifications', value: 12, icon: Shield, change: '+5' },
    { title: 'Active Disputes', value: 3, icon: AlertTriangle, change: '-2' },
    { title: 'Total Transactions', value: 856, icon: DollarSign, change: '+8%' }
  ];

  const quickActions = [
    { id: 'verification', title: 'Verify Traders', description: 'Review pending verifications', icon: Shield, color: 'bg-blue-600', section: 'verification' },
    { id: 'disputes', title: 'Resolve Disputes', description: 'Handle disputes', icon: AlertTriangle, color: 'bg-red-600', section: 'disputes' },
    { id: 'prices', title: 'Update Prices', description: 'Upload market prices', icon: TrendingUp, color: 'bg-green-600', section: 'prices' },
    { id: 'schemes', title: 'Manage Schemes', description: 'Manage government schemes', icon: FileText, color: 'bg-purple-600', section: 'schemes' }
  ];

  const recentActivities = [
    { id: 1, message: 'New trader verification request', time: '2 hours ago', icon: Shield },
    { id: 2, message: 'Dispute opened for TX123456', time: '4 hours ago', icon: AlertTriangle },
    { id: 3, message: 'Price update uploaded', time: '1 day ago', icon: TrendingUp }
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Admin Dashboard</h2>
            <p className="text-indigo-100 text-sm">Manage platform operations</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon as any;
          return (
            <div key={i} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-sm text-gray-600 font-medium">{s.title}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Icon size={24} className="text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon as any;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.section)}
                className={`${action.color} text-white p-4 rounded-xl shadow-lg transition-colors flex items-center justify-between`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-lg">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
                <Eye size={18} className="opacity-90" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
        </div>
        <div className="space-y-3">
          {recentActivities.map((act) => (
            <div key={act.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <act.icon size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{act.message}</p>
                <p className="text-xs text-gray-500">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
