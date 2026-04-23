import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, AlertTriangle, IndianRupee, TrendingUp,
  Search, CheckCircle, XCircle, Clock, ChevronRight, RefreshCw,
  Eye, EyeOff, LogOut, Ban, UserCheck, ArrowUpRight, Filter,
  Download, Send, MoreVertical, Loader2, AlertCircle, X,
  Activity, Package, Star, FileText, Landmark, ChevronDown, Camera, Truck
} from 'lucide-react';
import { api } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────
interface AdminStats {
  total_farmers: number; total_traders: number;
  total_orders: number; active_orders: number;
  total_gmv: number; platform_revenue: number;
  pending_kyc: number; open_disputes: number;
  pending_payouts: number; avg_order_value: number;
}
interface KYCRecord {
  id: string; user_id: string; user_name: string; user_phone: string; user_email: string;
  pan_number: string; pan_name: string; pan_dob: string;
  aadhaar_last4: string; aadhaar_name: string; aadhaar_address: string;
  selfie_url: string; aadhaar_doc_url: string;
  face_match_score: number | null;
  status: string; submitted_at: string; rejection_reason?: string;
}
interface Dispute {
  id: string; order_id: string;
  farmer_name: string; farmer_phone: string;
  trader_name: string; trader_phone: string;
  crop_name: string; final_amount: number;
  reason: string; details: string;
  raised_by_name: string; status: string;
  created_at: string; resolution?: string;
}
interface AdminUser {
  id: string; full_name: string; phone: string; email: string;
  role: 'farmer' | 'trader'; status: string;
  kyc_verified: boolean; avg_rating: number; rating_count: number;
  total_orders: number; total_gmv: number; joined_at: string;
  village?: string; city?: string;
}
interface PayoutRecord {
  id: string; order_id: string;
  farmer_name: string; farmer_phone: string;
  trader_name: string; trader_phone: string;
  crop_name: string;
  final_amount: number; payout_amount: number;
  status: string; failure_reason?: string;
  razorpay_payment_id?: string | null;
  created_at: string; bank_name?: string;
}
interface AdminOrder {
  id: string;
  crop_name: string;
  listing_title: string;
  quantity: number;
  unit: string;
  agreed_price: number;
  final_amount: number;
  status: string;
  farmer_name: string;
  trader_name: string;
  payment_status: string;
  created_at: string;
  produce_image_url?: string;
  delivery_photo_url?: string;
}

const inr = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(n);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric'
});

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
});

// ── Stat card ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, accent, urgent }: any) => (
  <div className={`rounded-xl border p-4 ${urgent ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'} shadow-sm`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${urgent ? 'bg-red-100' : 'bg-gray-50'}`}>
        <span className={urgent ? 'text-red-600' : accent}>{icon}</span>
      </div>
      {urgent && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Action needed</span>}
    </div>
    <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</p>
    <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Status badge ───────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    open:     'bg-rose-100 text-rose-800',
    resolved: 'bg-blue-100 text-blue-800',
    closed:   'bg-gray-100 text-gray-600',
    active:   'bg-green-100 text-green-800',
    suspended:'bg-red-100 text-red-800',
    failed:   'bg-red-100 text-red-800',
    paid:     'bg-green-100 text-green-800',
    kyc_pending: 'bg-orange-100 text-orange-800',
    bank_pending:'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════
const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [tab, setTab] = useState<'overview'|'kyc'|'disputes'|'users'|'payouts'|'orders'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Per-tab data
  const [kycList, setKycList]       = useState<KYCRecord[]>([]);
  const [disputes, setDisputes]     = useState<Dispute[]>([]);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [payouts, setPayouts]       = useState<PayoutRecord[]>([]);
  const [orders, setOrders]         = useState<AdminOrder[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Modals
  const [kycModal, setKycModal]           = useState<KYCRecord | null>(null);
  const [disputeModal, setDisputeModal]   = useState<Dispute | null>(null);
  const [payoutModal, setPayoutModal]     = useState<PayoutRecord | null>(null);
  const [imageModal, setImageModal]       = useState<{produce: string | null, delivery: string | null} | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]                 = useState<{msg:string;ok:boolean}|null>(null);
  const [kycDecision, setKycDecision]     = useState<'approved'|'rejected'|null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');
  const [kycFilter, setKycFilter]         = useState<'pending'|'approved'|'rejected'>('pending');
  const [userSearch, setUserSearch]       = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all'|'farmer'|'trader'>('all');
  const [payoutFilter, setPayoutFilter]   = useState<'all'|'failed'|'history'|'bank_pending'>('all');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.adminGetStats()
      .then(setStats)
      .catch(err => {
        console.error("Stats error:", err);
        showToast("Backend connection failed. Please ensure server is running.", false);
      })
      .finally(() => setLoadingStats(false));
  }, []);

  // Fetch tab data
  useEffect(() => {
    setTabLoading(true);
    const loadTabData = async () => {
      try {
        if (tab === 'kyc')      setKycList(await api.adminGetKYCList(kycFilter));
        if (tab === 'disputes') setDisputes(await api.adminGetDisputes());
        if (tab === 'users')    setUsers(await api.adminGetUsers({ search: userSearch, role: userRoleFilter }));
        if (tab === 'payouts')  setPayouts(await api.adminGetPayouts(payoutFilter));
        if (tab === 'orders')   setOrders(await api.getAdminDashboard());
      } catch (err) {
        console.error("Fetch error:", err);
        showToast(`Could not load ${tab} — backend unreachable.`, false);
      }
    };
    loadTabData().finally(() => setTabLoading(false));
  }, [tab, kycFilter, userSearch, userRoleFilter, payoutFilter]);

  // ── KYC actions ───────────────────────────────────────────────────
  const handleKYCDecision = async () => {
    if (!kycModal || !kycDecision) return;
    if (kycDecision === 'rejected' && !kycRejectReason.trim()) {
      showToast('Please enter a rejection reason.', false); return;
    }
    setActionLoading(true);
    try {
      await api.adminKYCDecision(kycModal.user_id, kycDecision, kycRejectReason);
      showToast(`KYC ${kycDecision} for ${kycModal.user_name}`);
      setKycModal(null); setKycDecision(null); setKycRejectReason('');
      setKycList(prev => prev.filter(k => k.user_id !== kycModal.user_id));
      if (stats) setStats({ ...stats, pending_kyc: Math.max(0, stats.pending_kyc - 1) });
    } catch (e: any) { showToast(e.message, false); }
    finally { setActionLoading(false); }
  };

  // ── Dispute actions ────────────────────────────────────────────────
  const handleResolveDispute = async (decision: 'farmer'|'trader'|'split') => {
    if (!disputeModal || !disputeResolution.trim()) {
      showToast('Please enter resolution notes.', false); return;
    }
    setActionLoading(true);
    try {
      await api.adminResolveDispute(disputeModal.id, { decision, resolution: disputeResolution });
      showToast(`Dispute resolved — ${decision === 'split' ? 'split refund' : `in favour of ${decision}`}`);
      setDisputeModal(null); setDisputeResolution('');
      setDisputes(prev => prev.filter(d => d.id !== disputeModal.id));
      if (stats) setStats({ ...stats, open_disputes: Math.max(0, stats.open_disputes - 1) });
    } catch (e: any) { showToast(e.message, false); }
    finally { setActionLoading(false); }
  };

  // ── User actions ───────────────────────────────────────────────────
  const handleToggleSuspend = async (user: AdminUser) => {
    setActionLoading(true);
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await api.adminUpdateUserStatus(user.id, newStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(`${user.full_name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
    } catch (e: any) { showToast(e.message, false); }
    finally { setActionLoading(false); }
  };

  // ── Manual payout ──────────────────────────────────────────────────
  const handleManualPayout = async () => {
    if (!payoutModal) return;
    setActionLoading(true);
    try {
      await api.adminManualPayout(payoutModal.order_id);
      showToast(`Manual payout triggered for ${payoutModal.farmer_name}`);
      setPayoutModal(null);
      setPayouts(prev => prev.filter(p => p.order_id !== payoutModal.order_id));
      if (stats) setStats({ ...stats, pending_payouts: Math.max(0, stats.pending_payouts - 1) });
    } catch (e: any) { showToast(e.message, false); }
    finally { setActionLoading(false); }
  };

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: <Activity size={16} />, badge: undefined },
    { id: 'kyc',       label: 'KYC',       icon: <ShieldCheck size={16} />, badge: stats?.pending_kyc || 0 },
    { id: 'orders',    label: 'Orders',    icon: <Package size={16} />, badge: undefined },
    { id: 'disputes',  label: 'Disputes',  icon: <AlertTriangle size={16} />, badge: stats?.open_disputes || 0 },
    { id: 'users',     label: 'Users',     icon: <Users size={16} />, badge: undefined },
    { id: 'payouts',   label: 'Payouts',   icon: <IndianRupee size={16} />, badge: stats?.pending_payouts || 0 },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-950 font-black text-xs">K</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">KrishiSethu Admin</p>
            <p className="text-xs text-slate-500">Operations console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {toast && (
            <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${toast.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {toast.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              {toast.msg}
            </div>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 px-6 flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}>
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${t.badge > 0 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* ════ OVERVIEW ════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={28} /></div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <StatCard label="Platform GMV" value={inr(stats?.total_gmv || 0)} sub="All-time" icon={<TrendingUp size={18} />} accent="text-green-500" />
                  <StatCard label="Revenue" value={inr(stats?.platform_revenue || 0)} sub="3% commission" icon={<IndianRupee size={18} />} accent="text-emerald-500" />
                  <StatCard label="Total orders" value={(stats?.total_orders || 0).toLocaleString('en-IN')} sub={`${stats?.active_orders || 0} active`} icon={<Package size={18} />} accent="text-blue-400" />
                  <StatCard label="Avg order" value={inr(stats?.avg_order_value || 0)} sub="per transaction" icon={<Activity size={18} />} accent="text-indigo-400" />
                  <StatCard label="Users" value={((stats?.total_farmers || 0) + (stats?.total_traders || 0)).toLocaleString('en-IN')} sub={`${stats?.total_farmers || 0}F · ${stats?.total_traders || 0}T`} icon={<Users size={18} />} accent="text-violet-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div onClick={() => setTab('kyc')} className="cursor-pointer">
                    <StatCard label="Pending KYC" value={stats?.pending_kyc || 0} sub="Awaiting review" icon={<ShieldCheck size={18} />} urgent={(stats?.pending_kyc || 0) > 0} />
                  </div>
                  <div onClick={() => setTab('disputes')} className="cursor-pointer">
                    <StatCard label="Open disputes" value={stats?.open_disputes || 0} sub="Needs resolution" icon={<AlertTriangle size={18} />} urgent={(stats?.open_disputes || 0) > 0} />
                  </div>
                  <div onClick={() => setTab('payouts')} className="cursor-pointer">
                    <StatCard label="Stuck payouts" value={stats?.pending_payouts || 0} sub="KYC / bank pending" icon={<Landmark size={18} />} urgent={(stats?.pending_payouts || 0) > 0} />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-sm font-semibold text-slate-300 mb-4">Quick actions</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Review KYC queue', tab: 'kyc',      color: 'border-amber-700 hover:bg-amber-900/30', text: 'text-amber-400' },
                      { label: 'Resolve disputes',  tab: 'disputes', color: 'border-rose-700 hover:bg-rose-900/30',   text: 'text-rose-400' },
                      { label: 'Manage users',      tab: 'users',    color: 'border-blue-700 hover:bg-blue-900/30',   text: 'text-blue-400' },
                      { label: 'Process payouts',   tab: 'payouts',  color: 'border-green-700 hover:bg-green-900/30', text: 'text-green-400' },
                    ].map(a => (
                      <button key={a.tab} onClick={() => setTab(a.tab as any)}
                        className={`border rounded-lg px-4 py-3 text-sm font-medium ${a.color} ${a.text} flex items-center justify-between transition-colors`}>
                        {a.label} <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ════ KYC QUEUE ═══════════════════════════════════════════════ */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-lg font-bold text-white">KYC Review Queue</p>
              <div className="flex gap-2">
                {(['pending','approved','rejected'] as const).map(f => (
                  <button key={f} onClick={() => setKycFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${kycFilter === f ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {tabLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={24} /></div> : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {(!kycList || kycList.length === 0) ? (
                  <div className="text-center py-16 text-slate-500">
                    <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No {kycFilter} KYC submissions</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs">
                        <th className="text-left px-5 py-3 font-medium">Farmer</th>
                        <th className="text-left px-4 py-3 font-medium">PAN</th>
                        <th className="text-left px-4 py-3 font-medium">Aadhaar</th>
                        <th className="text-left px-4 py-3 font-medium">Face match</th>
                        <th className="text-left px-4 py-3 font-medium">Submitted</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(Array.isArray(kycList) ? kycList : []).map(k => (
                        <tr key={k.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-white">{k.user_name}</p>
                            <p className="text-xs text-slate-500">{k.user_email || k.user_phone}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">{k.pan_number}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">****{k.aadhaar_last4}</td>
                          <td className="px-4 py-3">
                            {typeof k.face_match_score === 'number' ? (
                              <span className={`text-xs font-bold font-mono ${k.face_match_score >= 80 ? 'text-green-400' : k.face_match_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                {k.face_match_score.toFixed(0)}%
                              </span>
                            ) : <span className="text-xs text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(k.submitted_at)}</td>
                          <td className="px-4 py-3"><Badge status={k.status} /></td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setKycModal(k); setKycDecision(null); setKycRejectReason(''); }}
                              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium px-3 py-1.5 rounded-lg bg-green-900/20 hover:bg-green-900/40 transition-colors">
                              <Eye size={12} /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ DISPUTES ════════════════════════════════════════════════ */}
        {tab === 'disputes' && (
          <div className="space-y-4">
            <p className="text-lg font-bold text-white">Dispute Resolution</p>
            {tabLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={24} /></div> : (
              <div className="space-y-3">
                {(!disputes || disputes.length === 0) ? (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 text-center py-16 text-slate-500">
                    <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No open disputes</p>
                  </div>
                ) : (Array.isArray(disputes) ? disputes : []).map(d => (
                  <div key={d.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-mono text-slate-500">#{d.order_id.slice(0,8).toUpperCase()}</span>
                          <Badge status={d.status} />
                          <span className="text-xs text-slate-500">{fmtDateTime(d.created_at)}</span>
                        </div>
                        <p className="font-semibold text-white text-base mb-1">{d.crop_name} · {inr(d.final_amount)}</p>
                        <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
                          <span>Farmer: <span className="text-slate-300 font-medium">{d.farmer_name}</span></span>
                          <span>Trader: <span className="text-slate-300 font-medium">{d.trader_name}</span></span>
                          <span>Raised by: <span className="text-rose-400 font-medium">{d.raised_by_name}</span></span>
                        </div>
                        <div className="mt-2 bg-slate-800 rounded-lg p-3">
                          <span className="text-xs font-semibold text-rose-400">{d.reason}: </span>
                          <span className="text-xs text-slate-300">{d.details}</span>
                        </div>
                      </div>
                      {d.status === 'open' && (
                        <button onClick={() => { setDisputeModal(d); setDisputeResolution(''); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 px-4 py-2 rounded-lg transition-colors shrink-0">
                          Resolve <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                    {d.resolution && (
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <span className="text-xs text-slate-500">Resolution: </span>
                        <span className="text-xs text-green-400">{d.resolution}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ USERS ═══════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-600 transition-colors" />
              </div>
              <div className="flex gap-2">
                {(['all','farmer','trader'] as const).map(r => (
                  <button key={r} onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${userRoleFilter === r ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {tabLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={24} /></div> : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs">
                      <th className="text-left px-5 py-3 font-medium">User</th>
                      <th className="text-left px-4 py-3 font-medium">Role</th>
                      <th className="text-left px-4 py-3 font-medium">KYC</th>
                      <th className="text-right px-4 py-3 font-medium">Orders</th>
                      <th className="text-right px-4 py-3 font-medium">GMV</th>
                      <th className="text-left px-4 py-3 font-medium">Rating</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(Array.isArray(users) ? users : []).map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-white">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email || u.phone} · {u.village || u.city}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'farmer' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.kyc_verified
                            ? <CheckCircle size={14} className="text-green-500" />
                            : <XCircle size={14} className="text-slate-600" />}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{u.total_orders}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{inr(u.total_gmv)}</td>
                        <td className="px-4 py-3">
                          {u.avg_rating > 0 ? (
                            <span className="text-xs text-amber-400 font-mono">★ {u.avg_rating} <span className="text-slate-600">({u.rating_count})</span></span>
                          ) : <span className="text-xs text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3"><Badge status={u.status} /></td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleSuspend(u)} disabled={actionLoading}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40' : 'text-green-400 bg-green-900/20 hover:bg-green-900/40'}`}>
                            {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!users || users.length === 0) && !tabLoading && (
                  <div className="text-center py-12 text-slate-500 text-sm">No users found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ PAYOUTS ═════════════════════════════════════════════════ */}
        {tab === 'payouts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-lg font-bold text-white">
                {payoutFilter === 'history' ? 'Transaction History' : 'Stuck Payouts'}
              </p>
              <div className="flex gap-2">
                {(['all','failed','history','bank_pending'] as const).map(f => (
                  <button key={f} onClick={() => setPayoutFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${payoutFilter === f ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {f === 'history' ? 'Transaction History' : f.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>

            {tabLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={24} /></div> : (
              <div className="space-y-3">
                {(!payouts || payouts.length === 0) ? (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 text-center py-16 text-slate-500">
                    <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {payoutFilter === 'history' ? 'No payment history yet' : 'No stuck payouts'}
                    </p>
                  </div>
                ) : (Array.isArray(payouts) ? payouts : []).map(p => (
                  <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">#{p.order_id.slice(0,8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{p.crop_name}</span>
                        <Badge status={p.status} />
                      </div>
                      <p className="font-semibold text-white">{p.farmer_name}</p>
                      <p className="text-[11px] text-slate-500">Trader: <span className="text-slate-300">{p.trader_name}</span> · {p.farmer_phone}</p>
                      <p className="text-[11px] text-slate-500">{p.bank_name || 'Bank info pending'}</p>
                      {p.failure_reason && (
                        <p className="text-xs text-red-400 mt-1">{p.failure_reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400 font-mono">{inr(p.payout_amount)}</p>
                      <p className="text-xs text-slate-500">{fmtDate(p.created_at)}</p>
                    </div>
                    {p.status !== 'paid' ? (
                      <button onClick={() => setPayoutModal(p)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors shrink-0">
                        <Send size={12} /> Pay now
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-900/20 px-3 py-2 rounded-lg">
                        <CheckCircle size={14} /> Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ ORDERS HISTORY ══════════════════════════════════════════ */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-white">Order History</p>
              <button onClick={() => api.getAdminDashboard().then(setOrders)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                <RefreshCw size={16} className={tabLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {tabLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" size={24} /></div> : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs">
                      <th className="text-left px-5 py-3 font-medium">Order ID</th>
                      <th className="text-left px-4 py-3 font-medium">Produce</th>
                      <th className="text-left px-4 py-3 font-medium">Farmer</th>
                      <th className="text-left px-4 py-3 font-medium">Trader</th>
                      <th className="text-right px-4 py-3 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(Array.isArray(orders) ? orders : []).map(o => (
                      <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-green-400">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {o.produce_image_url ? (
                              <img src={o.produce_image_url} className="w-8 h-8 rounded object-cover border border-slate-700" alt="" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                                <Package size={14} className="text-slate-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white">{o.crop_name}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{o.listing_title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{o.farmer_name}</td>
                        <td className="px-4 py-3 text-slate-300">{o.trader_name}</td>
                        <td className="px-4 py-3 text-right font-mono text-white font-bold">
                          {inr(o.final_amount)}
                          <p className="text-[10px] text-slate-500 font-normal">{o.quantity} {o.unit}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={o.status} />
                          {o.payment_status === 'paid' && (
                            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Payment confirmed" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {fmtDateTime(o.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => setImageModal({ produce: o.produce_image_url || null, delivery: o.delivery_photo_url || null })}
                            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="View order images"
                          >
                            <Camera size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!orders || orders.length === 0) && !tabLoading && (
                  <div className="text-center py-16 text-slate-500">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No orders have been placed yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ KYC REVIEW MODAL ════════════════════════════════════════ */}
      {kycModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">KYC Review — {kycModal.user_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submitted {fmtDate(kycModal.submitted_at)}</p>
              </div>
              <button onClick={() => setKycModal(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Photos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Selfie</p>
                  {kycModal.selfie_url
                    ? <img src={kycModal.selfie_url} alt="Selfie" className="w-full h-48 object-cover rounded-xl border border-slate-700" />
                    : <div className="w-full h-48 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-slate-600 text-xs">No selfie</div>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Aadhaar document</p>
                  {kycModal.aadhaar_doc_url
                    ? <img src={kycModal.aadhaar_doc_url} alt="Aadhaar" className="w-full h-48 object-cover rounded-xl border border-slate-700" />
                    : <div className="w-full h-48 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-slate-600 text-xs">No document</div>}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">PAN details</p>
                  <div><p className="text-xs text-slate-500">PAN number</p><p className="text-sm font-mono text-white font-bold">{kycModal.pan_number}</p></div>
                  <div><p className="text-xs text-slate-500">Name on PAN</p><p className="text-sm text-white">{kycModal.pan_name}</p></div>
                  <div><p className="text-xs text-slate-500">Date of birth</p><p className="text-sm text-white">{kycModal.pan_dob}</p></div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aadhaar details</p>
                  <div><p className="text-xs text-slate-500">Aadhaar (last 4)</p><p className="text-sm font-mono text-white font-bold">**** **** {kycModal.aadhaar_last4}</p></div>
                  <div><p className="text-xs text-slate-500">Name</p><p className="text-sm text-white">{kycModal.aadhaar_name}</p></div>
                  <div><p className="text-xs text-slate-500">Address</p><p className="text-xs text-slate-300 leading-relaxed">{kycModal.aadhaar_address}</p></div>
                </div>
              </div>

              {/* Face match score */}
              {typeof kycModal.face_match_score === 'number' && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${kycModal.face_match_score >= 80 ? 'bg-green-900/30 border border-green-700' : kycModal.face_match_score >= 60 ? 'bg-amber-900/30 border border-amber-700' : 'bg-red-900/30 border border-red-700'}`}>
                  <div className={`text-3xl font-black font-mono ${kycModal.face_match_score >= 80 ? 'text-green-400' : kycModal.face_match_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {kycModal.face_match_score.toFixed(0)}%
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Face match score</p>
                    <p className="text-xs text-slate-400">{kycModal.face_match_score >= 80 ? 'Strong match — safe to approve' : kycModal.face_match_score >= 60 ? 'Moderate — review photos carefully' : 'Low match — likely reject'}</p>
                  </div>
                </div>
              )}

              {/* Decision */}
              {kycModal.status === 'pending' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Decision</p>
                  <div className="flex gap-3">
                    <button onClick={() => setKycDecision('approved')}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all ${kycDecision === 'approved' ? 'border-green-500 bg-green-900/40 text-green-300' : 'border-slate-700 text-slate-400 hover:border-green-700'}`}>
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => setKycDecision('rejected')}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all ${kycDecision === 'rejected' ? 'border-red-500 bg-red-900/40 text-red-300' : 'border-slate-700 text-slate-400 hover:border-red-700'}`}>
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                  {kycDecision === 'rejected' && (
                    <div>
                      <textarea rows={3} value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)}
                        placeholder="Reason for rejection (will be shown to the farmer)..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-600 resize-none" />
                    </div>
                  )}
                  <button onClick={handleKYCDecision} disabled={actionLoading || !kycDecision}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${kycDecision === 'approved' ? 'bg-green-600 hover:bg-green-500 text-white' : kycDecision === 'rejected' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                    {actionLoading ? 'Submitting...' : kycDecision ? `Confirm ${kycDecision}` : 'Select a decision above'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ DISPUTE MODAL ═══════════════════════════════════════════ */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Resolve Dispute</h3>
              <button onClick={() => setDisputeModal(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Order</span><span className="font-mono text-white">#{disputeModal.order_id?.slice(0,8).toUpperCase() || 'N/A'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Crop / Amount</span><span className="text-white">{disputeModal.crop_name} · {inr(disputeModal.final_amount || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Farmer</span><span className="text-green-400">{disputeModal.farmer_name} ({disputeModal.farmer_phone})</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Trader</span><span className="text-blue-400">{disputeModal.trader_name} ({disputeModal.trader_phone})</span></div>
              </div>
              <div className="bg-rose-900/20 border border-rose-800 rounded-xl p-4">
                <p className="text-xs font-bold text-rose-400 mb-1">{disputeModal.reason}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{disputeModal.details}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Resolution notes *</label>
                <textarea rows={4} value={disputeResolution} onChange={e => setDisputeResolution(e.target.value)}
                  placeholder="Describe the resolution — what was decided, what action was taken..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-600 resize-none" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Decide in favour of</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { d: 'farmer', label: 'Farmer', color: 'hover:border-green-600 hover:bg-green-900/20 hover:text-green-300' },
                    { d: 'trader', label: 'Trader', color: 'hover:border-blue-600 hover:bg-blue-900/20 hover:text-blue-300' },
                    { d: 'split',  label: 'Split refund', color: 'hover:border-amber-600 hover:bg-amber-900/20 hover:text-amber-300' },
                  ].map(opt => (
                    <button key={opt.d} onClick={() => handleResolveDispute(opt.d as any)} disabled={actionLoading || !disputeResolution.trim()}
                      className={`py-2.5 rounded-xl text-xs font-semibold border border-slate-700 text-slate-400 transition-all disabled:opacity-40 ${opt.color}`}>
                      {actionLoading ? <Loader2 className="animate-spin mx-auto" size={14} /> : opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ PAYOUT MODAL ════════════════════════════════════════════ */}
      {payoutModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Manual Payout</h3>
              <button onClick={() => setPayoutModal(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Farmer</span><span className="text-white font-semibold">{payoutModal.farmer_name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Trader</span><span className="text-white font-semibold">{payoutModal.trader_name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Crop</span><span className="text-green-400 font-semibold">{payoutModal.crop_name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Phone (Farmer)</span><span className="font-mono text-slate-300">{payoutModal.farmer_phone || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Order</span><span className="font-mono text-slate-300">#{payoutModal.order_id?.slice(0,8).toUpperCase() || 'N/A'}</span></div>
                {payoutModal.razorpay_payment_id && (
                  <div className="flex justify-between"><span className="text-slate-400">Razorpay ID</span><span className="font-mono text-blue-400">{payoutModal.razorpay_payment_id}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="text-slate-300">{payoutModal.bank_name || 'Not linked'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Stuck since</span><span className="text-slate-300">{fmtDate(payoutModal.created_at)}</span></div>
              </div>
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Amount to release</p>
                <p className="text-3xl font-black font-mono text-green-400">{inr(payoutModal.payout_amount || 0)}</p>
              </div>
              {payoutModal.failure_reason && (
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-400 mb-1">Failure reason</p>
                  <p className="text-xs text-slate-300">{payoutModal.failure_reason}</p>
                </div>
              )}
              <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-3 flex gap-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">This will immediately trigger an IMPS transfer to the farmer's registered bank account. This action cannot be undone.</p>
              </div>
              <button onClick={handleManualPayout} disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {actionLoading ? 'Processing...' : 'Confirm — Send Payment Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ IMAGE PREVIEW MODAL ═════════════════════════════════════ */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera size={16} className="text-green-500" /> Order Images
              </h3>
              <button onClick={() => setImageModal(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listing Photo (Produce)</p>
                {imageModal.produce ? (
                  <img src={imageModal.produce} className="w-full h-64 object-cover rounded-xl border border-slate-800 shadow-2xl" alt="Produce" />
                ) : (
                  <div className="w-full h-64 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700">
                    <Package size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">No produce image available</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Delivery Confirmation (Proof)</p>
                {imageModal.delivery ? (
                  <img src={imageModal.delivery} className="w-full h-64 object-cover rounded-xl border border-slate-800 shadow-2xl" alt="Delivery Proof" />
                ) : (
                  <div className="w-full h-64 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700">
                    <Truck size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">Waiting for delivery proof upload...</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 text-center">
              <button onClick={() => setImageModal(null)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
