import React, { useEffect, useState } from 'react';
import { Users, User, Tractor, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../Shared/LoadingSpinner';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'farmer' | 'trader'>('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setUsers(data || []);
            } catch (err: any) {
                console.error('Error fetching users:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
    const farmers = users.filter(u => u.role === 'farmer').length;
    const traders = users.filter(u => u.role === 'trader').length;

    const roleIcon = (role: string) => {
        if (role === 'farmer') return <Tractor size={16} className="text-green-600" />;
        if (role === 'trader') return <ShoppingCart size={16} className="text-blue-600" />;
        return <User size={16} className="text-purple-600" />;
    };

    const roleBadge = (role: string) => {
        if (role === 'farmer') return 'bg-green-100 text-green-700';
        if (role === 'trader') return 'bg-blue-100 text-blue-700';
        return 'bg-purple-100 text-purple-700';
    };

    if (loading) return <LoadingSpinner message="Loading users..." />;

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-5 text-white">
                <h2 className="text-xl font-bold">User Management</h2>
                <p className="text-purple-100 text-sm">{users.length} registered users</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'All', value: users.length, icon: <Users size={18} />, color: 'text-gray-700', bg: 'bg-gray-50' },
                    { label: 'Farmers', value: farmers, icon: <Tractor size={18} />, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Traders', value: traders, icon: <ShoppingCart size={18} />, color: 'text-blue-700', bg: 'bg-blue-50' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-100 p-3 text-center`}>
                        <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {(['all', 'farmer', 'trader'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Users List */}
            <div className="space-y-2">
                {filtered.map(user => (
                    <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {roleIcon(user.role)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800">{user.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{user.phone || '—'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${roleBadge(user.role)}`}>
                                {user.role}
                            </span>
                            <p className="text-xs text-gray-400">
                                {new Date(user.created_at).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
