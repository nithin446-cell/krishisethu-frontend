import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, CheckCircle, Clock, Truck, Package,
  IndianRupee, MapPin, Phone, MessageSquare, AlertCircle,
  ChevronDown, ChevronUp, Loader2, Camera, Upload,
  RefreshCw, Star, X, Navigation
} from 'lucide-react';
import { api } from '../lib/api';

type OrderStatus = 'placed' | 'confirmed' | 'dispatched' | 'delivered' | 'paid' | 'cancelled' | 'disputed';
type UserRole = 'farmer' | 'trader';

interface StatusEvent {
  status: OrderStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

interface Order {
  id: string;
  listing_title: string;
  crop_name: string;
  quantity: number;
  unit: string;
  agreed_price: number;
  final_amount: number;
  status: OrderStatus;
  farmer_id: string; farmer_name: string; farmer_phone: string; farmer_village: string;
  trader_id: string; trader_name: string; trader_phone: string; trader_city: string;
  payment_status: string;
  created_at: string;
  dispatched_at?: string;
  delivered_at?: string;
  paid_at?: string;
  dispatch_note?: string;
  vehicle_number?: string;
  delivery_photo_url?: string;
  status_history: StatusEvent[];
}

interface OrderTrackingProps {
  orderId: string | null;
  currentUserId: string;
  userRole: UserRole;
  onBack: () => void;
  onOpenChat?: (orderId: string, otherUserId: string, otherUserName: string) => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }> = {
  placed:     { label: 'Order Placed',     icon: <Package size={18} />,     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   desc: 'Waiting for farmer to confirm' },
  confirmed:  { label: 'Confirmed',        icon: <CheckCircle size={18} />, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200',  desc: 'Farmer accepted the order' },
  dispatched: { label: 'Dispatched',       icon: <Truck size={18} />,       color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',  desc: 'Produce is on the way' },
  delivered:  { label: 'Delivered',        icon: <MapPin size={18} />,      color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',    desc: 'Trader confirmed receipt' },
  paid:       { label: 'Payment Released', icon: <IndianRupee size={18} />, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',   desc: 'Payment sent to farmer' },
  cancelled:  { label: 'Cancelled',        icon: <X size={18} />,           color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',     desc: 'Order was cancelled' },
  disputed:   { label: 'Disputed',         icon: <AlertCircle size={18} />, color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',    desc: 'Under dispute resolution' },
};

const STATUS_ORDER: OrderStatus[] = ['placed', 'confirmed', 'dispatched', 'delivered', 'paid'];

const fmt = (iso?: string) => iso
  ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  : null;

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, currentUserId, userRole, onBack, onOpenChat }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [modal, setModal] = useState<'dispatch' | 'delivery' | 'dispute' | 'rating' | null>(null);

  const [dispatchNote, setDispatchNote] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('1');

  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState<File | null>(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const deliveryPhotoRef = useRef<HTMLInputElement>(null);

  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  const [rating, setRating] = useState(0);
  const [ratingNote, setRatingNote] = useState('');

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetchOrder();
    const poll = setInterval(fetchOrder, 30000);
    return () => clearInterval(poll);
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const data = await api.getOrderById(orderId);
      setOrder(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };
  const closeModal = () => { setModal(null); setError(null); };

  const doAction = async (fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(true); setError(null);
    try { await fn(); await fetchOrder(); showToast(successMsg); closeModal(); }
    catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const handleConfirmOrder = () => doAction(() => api.updateOrderStatus(orderId!, 'confirmed'), 'Order confirmed! Trader has been notified.');

  const handleDispatch = () => {
    if (!dispatchNote.trim()) { setError('Please add dispatch details.'); return; }
    doAction(() => api.updateOrderStatus(orderId!, 'dispatched', { dispatch_note: dispatchNote, vehicle_number: vehicleNumber, estimated_days: estimatedDays }), 'Marked as dispatched! Trader notified via SMS.');
  };

  const handleDelivery = () => doAction(async () => {
    const fd = new FormData();
    fd.append('status', 'delivered');
    fd.append('delivery_note', deliveryNote);
    if (deliveryPhotoFile) fd.append('delivery_photo', deliveryPhotoFile);
    await api.updateOrderStatusWithPhoto(orderId!, fd);
  }, 'Delivery confirmed! Payment is being released to the farmer.');

  const handleDispute = () => {
    if (!disputeReason || !disputeDetails.trim()) { setError('Please select a reason and describe the issue.'); return; }
    doAction(() => api.raiseDispute(orderId!, { reason: disputeReason, details: disputeDetails }), 'Dispute submitted. Our team will review within 24 hours.');
  };

  const handleRating = () => {
    if (!rating) { setError('Please select a star rating.'); return; }
    doAction(() => api.submitRating(orderId!, { rating, note: ratingNote }), 'Rating submitted. Thank you!');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600" size={32} />
    </div>
  );
  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-gray-600 font-medium">Order not found</p>
      <button onClick={onBack} className="text-sm text-green-600 underline">Go back</button>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status];
  const stepIdx = STATUS_ORDER.indexOf(order.status);
  const otherParty = userRole === 'farmer'
    ? { id: order.trader_id, name: order.trader_name, phone: order.trader_phone, loc: order.trader_city }
    : { id: order.farmer_id, name: order.farmer_name, phone: order.farmer_phone, loc: order.farmer_village };

  const getCTA = () => {
    if (userRole === 'farmer' && order.status === 'placed')
      return { label: 'Confirm Order', color: 'bg-indigo-600 hover:bg-indigo-700', icon: <CheckCircle size={18} />, action: handleConfirmOrder };
    if (userRole === 'farmer' && order.status === 'confirmed')
      return { label: 'Mark as Dispatched', color: 'bg-orange-500 hover:bg-orange-600', icon: <Truck size={18} />, action: () => setModal('dispatch') };
    if (userRole === 'trader' && order.status === 'dispatched')
      return { label: 'Confirm Delivery Received', color: 'bg-teal-600 hover:bg-teal-700', icon: <MapPin size={18} />, action: () => setModal('delivery') };
    return null;
  };
  const cta = getCTA();

  const ModalWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={e => e.target === e.currentTarget && closeModal()}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-600" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{order.crop_name}</h1>
          <p className="text-xs text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <button onClick={fetchOrder} className="p-2 rounded-full hover:bg-gray-100"><RefreshCw size={16} className="text-gray-500" /></button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Toasts */}
        {toast && <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2"><CheckCircle size={16} className="text-green-600 shrink-0" /><p className="text-sm text-green-800 font-medium">{toast}</p></div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start"><AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-700 flex-1">{error}</p><button onClick={() => setError(null)}>✕</button></div>}

        {/* Status hero */}
        <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${cfg.bg} ${cfg.border}`}>
              <span className={cfg.color}>{cfg.icon}</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-sm text-gray-500">{cfg.desc}</p>
            </div>
          </div>

          {/* Step timeline */}
          <div className="flex items-start">
            {STATUS_ORDER.map((s, i) => {
              const done = i < stepIdx && !['cancelled','disputed'].includes(order.status);
              const active = i === stepIdx && !['cancelled','disputed'].includes(order.status);
              const sCfg = STATUS_CONFIG[s];
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center" style={{ flex: '0 0 36px' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                      done ? 'bg-green-500 border-green-500 text-white' :
                      active ? `${cfg.bg} ${cfg.border} ${cfg.color}` :
                      'bg-white border-gray-200 text-gray-400'
                    }`}>{done ? '✓' : i + 1}</div>
                    <p className="text-center mt-1 leading-tight" style={{ fontSize: 9, width: 42, color: done || active ? cfg.color.replace('text-','') : '#9ca3af' }}>{sCfg.label.split(' ')[0]}</p>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-0.5 flex-1 mt-4 transition-all ${i < stepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900">{order.crop_name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{order.listing_title}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-700">{inr(order.final_amount)}</p>
              <p className="text-xs text-gray-400">{order.quantity} {order.unit} × {inr(order.agreed_price)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-50">
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-0.5">Farmer</p>
              <p className="text-sm font-semibold text-gray-800">{order.farmer_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{order.farmer_village}</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-0.5">Trader</p>
              <p className="text-sm font-semibold text-gray-800">{order.trader_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{order.trader_city}</p>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">Placed {fmt(order.created_at)}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : order.payment_status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {order.payment_status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Dispatch info */}
        {order.dispatch_note && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 mb-1"><Truck size={15} className="text-orange-600" /><p className="text-sm font-bold text-orange-800">Dispatch Details</p></div>
            <p className="text-sm text-orange-700">{order.dispatch_note}</p>
            {order.vehicle_number && <p className="text-xs text-orange-600 font-mono">Vehicle: {order.vehicle_number}</p>}
            {order.dispatched_at && <p className="text-xs text-orange-400">Dispatched {fmt(order.dispatched_at)}</p>}
          </div>
        )}

        {/* Delivery photo */}
        {order.delivery_photo_url && (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-3 pb-2"><Camera size={15} className="text-teal-600" /><p className="text-sm font-bold text-teal-800">Delivery Proof</p></div>
            <img src={order.delivery_photo_url} alt="Delivery proof" className="w-full h-44 object-cover" />
            {order.delivered_at && <p className="text-xs text-teal-600 p-3">Confirmed {fmt(order.delivered_at)}</p>}
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Contact {userRole === 'farmer' ? 'Trader' : 'Farmer'}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-green-700 font-bold text-sm">{(otherParty.name || 'U')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{otherParty.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={9} />{otherParty.loc}</p>
            </div>
            <div className="flex gap-2">
              {otherParty.phone && (
                <a href={`tel:${otherParty.phone}`} className="w-9 h-9 bg-green-50 border border-green-200 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                  <Phone size={15} className="text-green-600" />
                </a>
              )}
              {onOpenChat && (
                <button onClick={() => onOpenChat(order.id, otherParty.id, otherParty.name)} className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <MessageSquare size={15} className="text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        {order.status_history?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2"><Clock size={16} className="text-gray-500" /><span className="text-sm font-semibold text-gray-800">Order History</span><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{order.status_history.length}</span></div>
              {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showHistory && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                {[...order.status_history].reverse().map((ev, i) => {
                  const ec = STATUS_CONFIG[ev.status];
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ec?.bg || 'bg-gray-50'} border ${ec?.border || 'border-gray-200'}`}>
                        <span className={`${ec?.color || 'text-gray-500'}`} style={{ fontSize: 12 }}>{ec?.icon}</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-gray-800">{ec?.label || ev.status}</p>
                        {ev.note && <p className="text-xs text-gray-500 mt-0.5">{ev.note}</p>}
                        <p className="text-xs text-gray-400 mt-1">{fmt(ev.timestamp)} · {ev.actor}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions row */}
        {!['cancelled', 'disputed'].includes(order.status) && stepIdx >= 2 && (
          <div className="flex gap-3">
            {order.status === 'paid' && (
              <button onClick={() => setModal('rating')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                <Star size={15} /> Rate this order
              </button>
            )}
            {order.status !== 'paid' && (
              <button onClick={() => setModal('dispute')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                <AlertCircle size={15} /> Raise a dispute
              </button>
            )}
          </div>
        )}

        {order.status === 'disputed' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1"><AlertCircle size={16} className="text-rose-600" /><p className="text-sm font-bold text-rose-800">Dispute Under Review</p></div>
            <p className="text-xs text-rose-600">Our team is investigating. You will receive a resolution within 24 hours via SMS.</p>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {cta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-lg mx-auto">
            <button onClick={cta.action} disabled={actionLoading}
              className={`w-full ${cta.color} text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-60`}>
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : cta.icon}
              {actionLoading ? 'Processing...' : cta.label}
            </button>
          </div>
        </div>
      )}

      {/* ── DISPATCH MODAL ── */}
      {modal === 'dispatch' && (
        <ModalWrap>
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Mark as Dispatched</h3><button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100"><X size={18} className="text-gray-500" /></button></div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transport Details *</label>
            <textarea rows={3} value={dispatchNote} onChange={e => setDispatchNote(e.target.value)}
              placeholder="e.g. Loaded on KSRTC truck, driver Ramesh (9876543210), arrives Yeshwanthpur market tomorrow"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none bg-gray-50 focus:bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle No.</label>
              <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="KA 01 AB 1234"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-400 outline-none bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Arrives in</label>
              <select value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-gray-50">
                {['Same day', '1 day', '2 days', '3 days', '4-5 days'].map((v, i) => <option key={i} value={String(i)}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
            <Truck size={14} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700">Trader will be notified via SMS with these details.</p>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={handleDispatch} disabled={actionLoading || !dispatchNote.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
            {actionLoading ? 'Saving...' : 'Confirm Dispatch'}
          </button>
        </ModalWrap>
      )}

      {/* ── DELIVERY MODAL ── */}
      {modal === 'delivery' && (
        <ModalWrap>
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Confirm Delivery</h3><button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100"><X size={18} className="text-gray-500" /></button></div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <IndianRupee size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Confirming delivery will release <strong>{inr(order.final_amount * 0.97)}</strong> to the farmer.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Photo</label>
            <input ref={deliveryPhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setDeliveryPhotoFile(f); setDeliveryPhotoPreview(URL.createObjectURL(f)); } }} />
            {deliveryPhotoPreview ? (
              <div className="relative">
                <img src={deliveryPhotoPreview} alt="Delivery" className="w-full h-36 object-cover rounded-xl" />
                <button onClick={() => { setDeliveryPhotoFile(null); setDeliveryPhotoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            ) : (
              <button onClick={() => deliveryPhotoRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-teal-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-teal-400 hover:bg-teal-50 transition-colors group">
                <Upload size={20} className="text-teal-400 group-hover:text-teal-600" />
                <span className="text-sm text-teal-500">Photo of received goods</span>
                <span className="text-xs text-gray-400">Recommended for dispute protection</span>
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea rows={2} value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}
              placeholder="e.g. 200kg tomatoes, good quality" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none bg-gray-50 focus:bg-white" />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={handleDelivery} disabled={actionLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            {actionLoading ? 'Releasing payment...' : 'Confirm & Release Payment'}
          </button>
        </ModalWrap>
      )}

      {/* ── DISPUTE MODAL ── */}
      {modal === 'dispute' && (
        <ModalWrap>
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Raise a Dispute</h3><button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100"><X size={18} className="text-gray-500" /></button></div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason *</label>
            <div className="grid grid-cols-2 gap-2">
              {['Wrong quantity', 'Poor quality', 'Not delivered', 'Damaged goods', 'Payment issue', 'Other'].map(r => (
                <button key={r} onClick={() => setDisputeReason(r)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${disputeReason === r ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Describe the issue *</label>
            <textarea rows={4} value={disputeDetails} onChange={e => setDisputeDetails(e.target.value)}
              placeholder="Describe what happened. Include dates, amounts, and any evidence you have."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none bg-gray-50 focus:bg-white" />
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">Order will be frozen and both parties contacted within 24 hours.</p>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={handleDispute} disabled={actionLoading || !disputeReason || !disputeDetails.trim()}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <AlertCircle size={18} />}
            {actionLoading ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </ModalWrap>
      )}

      {/* ── RATING MODAL ── */}
      {modal === 'rating' && (
        <ModalWrap>
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Rate {userRole === 'farmer' ? 'Trader' : 'Farmer'}</h3><button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100"><X size={18} className="text-gray-500" /></button></div>
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 mb-4">How was your experience with {otherParty?.name}?</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={`text-4xl transition-transform hover:scale-110 ${s <= rating ? 'opacity-100' : 'opacity-25'}`}>⭐</button>
              ))}
            </div>
            {rating > 0 && <p className="text-sm font-semibold text-amber-600 mt-2">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comment (optional)</label>
            <textarea rows={3} value={ratingNote} onChange={e => setRatingNote(e.target.value)}
              placeholder="Share your experience to help others..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none bg-gray-50 focus:bg-white" />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={handleRating} disabled={actionLoading || !rating}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Star size={18} />}
            {actionLoading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </ModalWrap>
      )}
    </div>
  );
};

export default OrderTracking;
