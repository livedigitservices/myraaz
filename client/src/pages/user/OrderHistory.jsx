import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiClock, FiCheckCircle, FiTruck,
  FiXCircle, FiBox, FiChevronDown, FiChevronUp,
  FiHeart, FiShoppingCart, FiEdit2, FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:    { bg: '#FEF3C7', color: '#D97706', icon: <FiClock size={11} />       },
    processing: { bg: '#DBEAFE', color: '#2563EB', icon: <FiBox size={11} />         },
    shipped:    { bg: '#E0E7FF', color: '#7C3AED', icon: <FiTruck size={11} />       },
    delivered:  { bg: '#D1FAE5', color: '#059669', icon: <FiCheckCircle size={11} /> },
    cancelled:  { bg: '#FEE2E2', color: '#DC2626', icon: <FiXCircle size={11} />     },
  };
  const s = map[status] || map.pending;
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.icon} {status}
    </span>
  );
};

/* ── Order Progress ── */
const OrderProgress = ({ status }) => {
  const steps     = ['pending', 'processing', 'shipped', 'delivered'];
  const cancelled = status === 'cancelled';
  const current   = steps.indexOf(status);

  if (cancelled) return (
    <div className="flex items-center gap-2 py-3">
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-100">
        <FiXCircle size={12} className="text-red-500" />
      </div>
      <span className="text-xs text-red-500 font-medium">Order Cancelled</span>
    </div>
  );

  return (
    <div className="flex items-center py-3 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                 style={{
                   backgroundColor: i <= current ? 'var(--color-primary)' : 'var(--color-soft)',
                   color: i <= current ? 'white' : 'var(--color-muted)',
                 }}>
              {i < current ? '✓' : i + 1}
            </div>
            <p className="text-xs mt-1 capitalize whitespace-nowrap"
               style={{ color: i <= current ? 'var(--color-primary)' : 'var(--color-muted)' }}>
              {step}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className="w-12 sm:w-16 h-0.5 mx-1 mb-4"
                 style={{ backgroundColor: i < current
                   ? 'var(--color-primary)' : 'var(--color-soft)' }} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Return Status Badge ── */
const ReturnBadge = ({ status }) => {
  const map = {
    pending:  { bg: '#FEF3C7', color: '#D97706', label: '⏳ Return Pending'  },
    approved: { bg: '#D1FAE5', color: '#059669', label: '✓ Return Approved' },
    rejected: { bg: '#FEE2E2', color: '#DC2626', label: '✗ Return Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

/* ════════════════════════════════════
   RETURN REQUEST SECTION
════════════════════════════════════ */
const ReturnSection = ({ order, onUpdate }) => {
  const [step, setStep]             = useState('idle'); // idle | checking | form | submitted
  const [eligibility, setEligibility] = useState(null);
  const [reason, setReason]         = useState('');
  const [loading, setLoading]       = useState(false);

  const REASONS = [
    'Product damaged or defective',
    'Wrong product received',
    'Product not as described',
    'Changed my mind',
    'Better price available',
    'Other',
  ];

  /* Already has a return request */
  if (order.returnRequest?.requested) {
    return (
      <div className="mt-4 p-4 rounded-xl"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
           style={{ color: 'var(--color-muted)' }}>Return Request</p>
        <ReturnBadge status={order.returnRequest.status} />
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          Reason: {order.returnRequest.reason}
        </p>
        {order.returnRequest.returnableItems?.length > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Items: {order.returnRequest.returnableItems.join(', ')}
          </p>
        )}
        {order.returnRequest.adminNote && (
          <div className="mt-2 p-2 rounded-lg bg-white">
            <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>
              Admin note:
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {order.returnRequest.adminNote}
            </p>
          </div>
        )}
      </div>
    );
  }

  /* Check eligibility */
  const handleCheck = async () => {
    try {
      setStep('checking');
      const { data } = await api.get(`/returns/eligibility/${order._id}`);
      setEligibility(data);
      setStep('form');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check eligibility');
      setStep('idle');
    }
  };

  /* Submit return */
  const handleSubmit = async () => {
    if (!reason) return toast.error('Please select a reason');
    try {
      setLoading(true);
      const { data } = await api.post(`/returns/${order._id}`, { reason });
      toast.success('Return request submitted! 📦');
      onUpdate(data.order);
      setStep('idle');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl"
         style={{ backgroundColor: 'var(--color-soft)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
         style={{ color: 'var(--color-muted)' }}>Return Policy</p>

      {/* IDLE — show check button */}
      {step === 'idle' && (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
            Not satisfied? Check if your items are eligible for return.
          </p>
          <button onClick={handleCheck}
            className="text-xs font-medium px-4 py-2 rounded-full transition-all"
            style={{ border: '1.5px solid var(--color-primary)',
                     color: 'var(--color-primary)' }}>
            Check Return Eligibility
          </button>
        </div>
      )}

      {/* CHECKING */}
      {step === 'checking' && (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"
               style={{ color: 'var(--color-primary)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Checking eligibility...
          </span>
        </div>
      )}

      {/* FORM — show eligibility + reason */}
      {step === 'form' && eligibility && (
        <div className="space-y-4">

          {/* Per-item status */}
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>
              Item Return Status
            </p>
            {eligibility.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                   style={{ backgroundColor: item.eligible ? '#F0FDF4' : '#FEF2F2' }}>
                {/* Image */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <img src={item.image} alt={item.name}
                       className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1"
                     style={{ color: 'var(--color-dark)' }}>
                    {item.name}
                  </p>
                  {item.eligible ? (
                    <p className="text-xs text-green-600 mt-0.5">
                      ✓ Returnable · {item.daysLeft} day{item.daysLeft !== 1 ? 's' : ''} left
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-0.5">
                      ✗ {item.reason}
                    </p>
                  )}
                </div>

                {/* Badge */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                     style={{ backgroundColor: item.eligible ? '#22c55e' : '#ef4444' }}>
                  <span className="text-white text-xs font-bold">
                    {item.eligible ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* If eligible — show reason form */}
          {eligibility.eligible ? (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                Select a reason
              </p>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label key={r}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
                               transition-all"
                    style={{
                      backgroundColor: reason === r ? 'white' : 'transparent',
                      border: reason === r
                        ? '1.5px solid var(--color-primary)'
                        : '1.5px solid transparent',
                    }}
                    onClick={() => setReason(r)}>
                    {/* Radio */}
                    <div className="w-4 h-4 rounded-full border-2 flex items-center
                                    justify-center shrink-0"
                         style={{
                           borderColor: reason === r
                             ? 'var(--color-primary)' : 'var(--color-secondary)',
                           backgroundColor: reason === r
                             ? 'var(--color-primary)' : 'transparent',
                         }}>
                      {reason === r && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-dark)' }}>
                      {r}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleSubmit} disabled={loading || !reason}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white
                             text-sm font-medium transition-all disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Submitting...
                    </>
                  ) : '📦 Submit Return Request'}
                </button>
                <button onClick={() => { setStep('idle'); setReason(''); }}
                  className="px-5 py-2.5 rounded-full text-sm font-medium"
                  style={{ border: '1px solid var(--color-soft)',
                           color: 'var(--color-muted)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Not eligible */
            <div>
              <p className="text-sm font-medium text-red-500 mb-1">
                Not eligible for return
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
                {eligibility.message}
              </p>
              <button onClick={() => setStep('idle')}
                className="text-xs px-4 py-2 rounded-full"
                style={{ backgroundColor: 'white', color: 'var(--color-muted)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════
   ORDER CARD
════════════════════════════════════ */
const OrderCard = ({ order, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Header — click to expand */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer
                      hover:bg-soft/30 transition-colors"
           onClick={() => setExpanded(!expanded)}
           style={{ borderBottom: expanded ? '1px solid var(--color-soft)' : 'none' }}>
        <div className="flex items-center gap-3 min-w-0">
          {/* First item image */}
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            {order.orderItems?.[0]?.image ? (
              <img src={order.orderItems[0].image}
                   className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FiBox size={16} style={{ color: 'var(--color-muted)' }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-mono font-semibold"
                 style={{ color: 'var(--color-dark)' }}>
                #{order._id.slice(-8).toUpperCase()}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {order.orderItems?.length} item(s) ·{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-base font-semibold"
             style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
            ₹{order.totalPrice?.toLocaleString('en-IN')}
          </p>
          {expanded
            ? <FiChevronUp size={16} style={{ color: 'var(--color-muted)' }} />
            : <FiChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">

          {/* Progress */}
          <OrderProgress status={order.status} />

          <div className="h-px" style={{ backgroundColor: 'var(--color-soft)' }} />

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3"
               style={{ color: 'var(--color-muted)' }}>Items Ordered</p>
            <div className="space-y-3">
              {order.orderItems?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1"
                       style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0"
                     style={{ color: 'var(--color-primary)',
                              fontFamily: 'var(--font-serif)' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--color-soft)' }} />

          {/* Shipping + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                 style={{ color: 'var(--color-muted)' }}>Shipping To</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                {order.shippingAddress?.fullName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                📱 {order.shippingAddress?.phone}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {order.shippingAddress?.address}, {order.shippingAddress?.city},
                {' '}{order.shippingAddress?.state} — {order.shippingAddress?.pincode}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                 style={{ color: 'var(--color-muted)' }}>Payment</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                {order.paymentMethod}
              </p>
              <p className="text-xs mt-0.5"
                 style={{ color: order.isPaid ? '#059669' : '#D97706' }}>
                {order.isPaid ? '✓ Paid' : 'Pending payment'}
              </p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="p-4 rounded-xl space-y-2"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-muted)' }}>Items total</span>
              <span style={{ color: 'var(--color-dark)' }}>
                ₹{order.itemsPrice?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
              <span style={{ color: order.shippingPrice === 0 ? '#059669' : 'var(--color-dark)' }}>
                {order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}
              </span>
            </div>
            <div className="h-px" style={{ backgroundColor: 'var(--color-secondary)' }} />
            <div className="flex justify-between text-sm font-semibold">
              <span style={{ color: 'var(--color-dark)' }}>Total</span>
              <span style={{ color: 'var(--color-primary)',
                             fontFamily: 'var(--font-serif)' }}>
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ── RETURN SECTION — only for delivered orders ── */}
          {order.status === 'delivered' && (
            <ReturnSection order={order} onUpdate={onUpdate} />
          )}

        </div>
      )}
    </div>
  );
};

/* ── Sidebar ── */
const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

/* ════════════════════════════════════
   ORDER HISTORY PAGE
════════════════════════════════════ */
export default function OrderHistory() {
  const { userInfo }          = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const statuses = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/orders/mine');
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* Called when return request is submitted */
  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(o =>
      o._id === updatedOrder._id ? updatedOrder : o
    ));
  };

  const filtered = filter
    ? orders.filter(o => o.status === filter)
    : orders;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col items-center px-4 mb-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl
                          font-bold text-white mb-2"
               style={{ backgroundColor: 'var(--color-primary)' }}>
            {userInfo?.name?.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold line-clamp-1"
             style={{ color: 'var(--color-dark)' }}>{userInfo?.name}</p>
          <p className="text-xs line-clamp-1" style={{ color: 'var(--color-muted)' }}>
            {userInfo?.email || userInfo?.phone}
          </p>
        </div>
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>My Account</p>
        <SideLink to="/dashboard"         icon={<FiUser size={16} />}       label="Overview"     />
        <SideLink to="/dashboard/orders"  icon={<FiPackage size={16} />}    label="My Orders" active />
        <SideLink to="/dashboard/profile" icon={<FiEdit2 size={16} />}      label="Edit Profile" />
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mt-4 mb-1"
           style={{ color: 'var(--color-muted)' }}>Shopping</p>
        <SideLink to="/wishlist"  icon={<FiHeart size={16} />}        label="Wishlist" />
        <SideLink to="/cart"      icon={<FiShoppingCart size={16} />} label="Cart"     />
        <SideLink to="/products"  icon={<FiBox size={16} />}          label="Shop"     />
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6 max-w-3xl min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            My Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {orders.length} total orders
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0"
              style={{
                backgroundColor: filter === s ? 'var(--color-primary)' : 'var(--color-soft)',
                color: filter === s ? 'white' : 'var(--color-muted)',
              }}>
              {s || 'All'} ({s ? orders.filter(o => o.status === s).length : orders.length})
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex gap-4 items-center">
                  <div className="w-11 h-11 rounded-xl"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full"
                         style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-20 rounded-full"
                         style={{ backgroundColor: 'var(--color-soft)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              <FiPackage size={28} style={{ color: 'var(--color-muted)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
              {filter ? `No ${filter} orders` : 'No orders yet'}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
              {filter ? 'Try a different filter' : 'Place your first order today!'}
            </p>
            {!filter && (
              <Link to="/products" className="btn-primary text-xs px-5 py-2">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onUpdate={handleOrderUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}