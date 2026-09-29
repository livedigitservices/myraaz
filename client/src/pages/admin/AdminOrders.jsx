import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiTruck, FiXCircle,
  FiPackage, FiSearch, FiTrendingUp, FiBox,
  FiUsers, FiShoppingCart, FiEye, FiChevronDown,
  FiX, FiMapPin, FiCreditCard, FiUser, FiTag,
  FiHome
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

/* ── Eyebrow — flanked-line label used across the site ── */
const Eyebrow = ({ children }) => (
  <div className="flex items-center gap-2.5">
    <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
    <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
      {children}
    </p>
  </div>
);

/* ── Status badge — outlined, keeps semantic color per status ── */
const StatusBadge = ({ status }) => {
  const styles = {
    pending:    { color: '#D97706', icon: <FiClock size={11} />       },
    processing: { color: '#2563EB', icon: <FiPackage size={11} />     },
    shipped:    { color: '#7C3AED', icon: <FiTruck size={11} />       },
    delivered:  { color: '#059669', icon: <FiCheckCircle size={11} /> },
    cancelled:  { color: '#DC2626', icon: <FiXCircle size={11} />     },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide w-fit"
          style={{ border: `1px solid ${s.color}55`, color: s.color }}>
      {s.icon} {status}
    </span>
  );
};

/* ── Sidebar link — hairline indicator, matches Dashboard/Users/Products ── */
const SideLink = ({ to, icon, label, active, onClick }) => (
  <Link to={to} onClick={onClick}
    className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
    style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)', fontWeight: active ? 600 : 400 }}>
    <span
      className={`block h-px transition-all duration-300 ${active ? 'w-3' : 'w-0 group-hover:w-3'}`}
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>{icon}</span>
    {label}
  </Link>
);

/* ── Sidebar content ── */
const SidebarContent = ({ onClose }) => {
  const { pathname } = useLocation();
  return (
    <>
      <div className="px-4 mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
          Admin Panel
        </p>
        <p className="text-base font-semibold mt-1"
           style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
      </div>
      <p className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
         style={{ color: 'var(--color-accent)' }}>Overview</p>
      <SideLink to="/admin"            onClick={onClose} icon={<FiTrendingUp size={16} />}   label="Dashboard"  active={pathname === '/admin'} />
      <SideLink to="/admin/products"   onClick={onClose} icon={<FiBox size={16} />}          label="Products"   active={pathname === '/admin/products'} />
      <SideLink to="/admin/orders"     onClick={onClose} icon={<FiShoppingCart size={16} />} label="Orders"     active={pathname === '/admin/orders'} />
      <SideLink to="/admin/users"      onClick={onClose} icon={<FiUsers size={16} />}        label="Users"      active={pathname === '/admin/users'} />
      <SideLink to="/admin/coupons"    onClick={onClose} icon={<FiTag size={16} />}          label="Coupons"    active={pathname === '/admin/coupons'} />
      <SideLink to="/admin/returns"    onClick={onClose} icon={<FiPackage size={16} />}      label="Returns"    active={pathname === '/admin/returns'} />
      <SideLink to="/admin/home-media" onClick={onClose} icon={<FiHome size={16} />}         label="Home Media" active={pathname === '/admin/home-media'} />

      <div className="mt-auto px-4 pt-4" style={{ borderTop: '1px solid var(--color-soft)' }}>
        <Link to="/" className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--color-muted)' }}>
          <FiEye size={13} /> View Store
        </Link>
      </div>
    </>
  );
};

/* ══════════════════════════════════════
   ORDER DETAIL MODAL
══════════════════════════════════════ */
const OrderDetailModal = ({ order, onClose, onStatusUpdate }) => {
  const [status, setStatus]     = useState(order.status);
  const [updating, setUpdating] = useState(false);

  // ── Mount/close animation state ──
  // `visible` drives the enter transition (false → true right after mount).
  // `closing` drives the exit transition; onClose only fires once it finishes.
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const ANIM_MS = 260;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, ANIM_MS);
  };

  const handleUpdate = async () => {
    if (status === order.status) return;
    try {
      setUpdating(true);
      await api.put(`/orders/admin/${order._id}/status`, { status });
      onStatusUpdate(order._id, status);
      toast.success(`Order updated to "${status}" ✅`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const subtotal = order.orderItems?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
        style={{ transitionDuration: `${ANIM_MS}ms`, opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-none transition-all ease-out"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            borderTop: '2px solid var(--color-accent)',
            transitionDuration: `${ANIM_MS}ms`,
            transitionTimingFunction: closing ? 'cubic-bezier(0.4,0,1,1)' : 'cubic-bezier(0.16,1,0.3,1)',
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'translateY(0) scale(1)'
              : 'translateY(24px) scale(0.98)',
          }}
        >

          {/* Drag handle — mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full"
                 style={{ backgroundColor: 'var(--color-soft)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white z-10"
               style={{ borderBottom: '1px solid var(--color-soft)' }}>
            <div>
              <Eyebrow>Order Details</Eyebrow>
              <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--color-muted)' }}>
                #{order._id.slice(-10).toUpperCase()}
              </p>
            </div>
            <button onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-soft transition-transform hover:rotate-90"
              style={{ color: 'var(--color-muted)', transitionDuration: '200ms' }}>
              <FiX size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">

            {/* Status update */}
            <div className="p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-3"
                 style={{ color: 'var(--color-muted)' }}>Update Status</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <StatusBadge status={order.status} />
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className="w-full text-xs px-3 py-2 appearance-none pr-7
                                 cursor-pointer border bg-white"
                      style={{ borderColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                      {['pending','processing','shipped','delivered','cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <FiChevronDown size={11}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-muted)' }} />
                  </div>
                  <button onClick={handleUpdate}
                    disabled={updating || status === order.status}
                    className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-white
                               transition-all disabled:opacity-40 hover:opacity-90 shrink-0"
                    style={{ backgroundColor: 'var(--color-dark)' }}>
                    {updating ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-3"
                 style={{ color: 'var(--color-muted)' }}>
                Products Ordered ({order.orderItems?.length})
              </p>
              <div className="space-y-3">
                {order.orderItems?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <div className="w-14 h-14 overflow-hidden shrink-0"
                         style={{ backgroundColor: 'white' }}>
                      <img src={item.image} alt={item.name}
                           className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1"
                         style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-white"
                              style={{ color: 'var(--color-muted)' }}>
                          Qty: <strong style={{ color: 'var(--color-dark)' }}>{item.quantity}</strong>
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          ₹{item.price}/unit
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold"
                         style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-3"
                 style={{ color: 'var(--color-muted)' }}>Price Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>
                    Items ({order.orderItems?.reduce((s, i) => s + i.quantity, 0)} units)
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
                  <span style={{ color: order.shippingPrice === 0 ? 'var(--color-accent)' : 'var(--color-dark)' }}>
                    {order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}
                  </span>
                </div>
                <div className="h-px" style={{ backgroundColor: 'var(--color-secondary)' }} />
                <div className="flex justify-between font-semibold">
                  <span style={{ color: 'var(--color-dark)' }}>Total</span>
                  <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer + Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FiUser size={13} style={{ color: 'var(--color-accent)' }} />
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em]"
                     style={{ color: 'var(--color-muted)' }}>Customer</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center
                                  text-white text-sm font-bold shrink-0"
                       style={{ backgroundColor: 'var(--color-dark)' }}>
                    {order.user?.name?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate"
                       style={{ color: 'var(--color-dark)' }}>
                      {order.user?.name || 'Guest'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {order.user?.email || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FiMapPin size={13} style={{ color: 'var(--color-accent)' }} />
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em]"
                     style={{ color: 'var(--color-muted)' }}>Ship To</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                  {order.shippingAddress?.fullName || order.user?.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  📱 {order.shippingAddress?.phone || '—'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  {order.shippingAddress?.address}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                  {' — '}{order.shippingAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-soft)' }}>
              <FiCreditCard size={16} style={{ color: 'var(--color-accent)' }} />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em]"
                   style={{ color: 'var(--color-muted)' }}>Payment</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-dark)' }}>
                  {order.paymentMethod}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-medium uppercase tracking-wide px-2.5 py-1"
                      style={{
                        border: `1px solid ${order.isPaid ? '#059669' : '#D97706'}55`,
                        color: order.isPaid ? '#059669' : '#D97706',
                      }}>
                  {order.isPaid ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Date */}
            <p className="text-xs text-center pb-2" style={{ color: 'var(--color-muted)' }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════
   ADMIN ORDERS PAGE
══════════════════════════════════════ */
export default function AdminOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [updating, setUpdating]           = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/admin');
        setOrders(data);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdating(orderId);
      await api.put(`/orders/admin/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order marked as ${status} ✅`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleModalStatusUpdate = (orderId, status) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    setSelectedOrder(prev => prev ? { ...prev, status } : prev);
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    const matchSearch = search
      ? o._id.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── DESKTOP SIDEBAR (mobile uses the shared AdminMobileBottomNav) ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-8 px-4 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)' }}>
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* ── MAIN — pb-24 on mobile so content clears the fixed bottom nav ── */}
      <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0">

        {/* Header */}
        <div className="mb-6">
          <Eyebrow>Order Management</Eyebrow>
          <h1 className="text-xl sm:text-2xl font-semibold mt-2"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Orders
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {filtered.length} of {orders.length} orders
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <FiSearch size={15} className="absolute left-1 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input type="text" placeholder="Search by order ID, name or email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent focus:outline-none"
              style={{ borderBottom: '1.5px solid var(--color-soft)', color: 'var(--color-dark)' }}
              onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--color-accent)'}
              onBlur={e => e.currentTarget.style.borderBottomColor = 'var(--color-soft)'} />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-sm w-full sm:w-44 appearance-none pr-8 py-2.5 bg-transparent focus:outline-none"
              style={{ color: 'var(--color-dark)', borderBottom: '1.5px solid var(--color-soft)' }}>
              {statuses.map(s => (
                <option key={s} value={s}>{s ? s : 'All Statuses'}</option>
              ))}
            </select>
            <FiChevronDown size={13}
              className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted)' }} />
          </div>
        </div>

        {/* Status tabs — horizontal scroll on mobile */}
        <div className="flex gap-6 mb-6 overflow-x-auto pb-1 scrollbar-hide"
             style={{ borderBottom: '1px solid var(--color-soft)' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="relative pb-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors shrink-0"
              style={{ color: filterStatus === s ? 'var(--color-dark)' : 'var(--color-muted)' }}>
              {s || 'All'} ({s ? orders.filter(o => o.status === s).length : orders.length})
              {filterStatus === s && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5" style={{ backgroundColor: 'var(--color-accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* ── TABLE (desktop) / CARDS (mobile) ── */}
        {loading ? (
          <div className="bg-white p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse items-center">
                <div className="h-10 w-24" style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white py-16 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ border: '1px solid var(--color-accent)' }}>
              <FiPackage size={26} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
              No orders found
            </p>
          </div>
        ) : (
          <>
            {/* ── MOBILE CARDS ── */}
            <div className="flex flex-col gap-3 lg:hidden">
              {filtered.map(order => (
                <div key={order._id} className="bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs font-mono font-semibold"
                         style={{ color: 'var(--color-dark)' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Customer */}
                  <p className="text-sm font-medium mb-1"
                     style={{ color: 'var(--color-dark)' }}>
                    {order.user?.name || 'Guest'}
                  </p>

                  {/* Product thumbnails */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {order.orderItems?.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-8 h-8 overflow-hidden border-2
                                                border-white shrink-0"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <img src={item.image} alt={item.name}
                               className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.orderItems?.length > 3 && (
                        <div className="w-8 h-8 border-2 border-white
                                        flex items-center justify-center text-xs font-bold"
                             style={{ backgroundColor: 'var(--color-soft)',
                                      color: 'var(--color-primary)' }}>
                          +{order.orderItems.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {order.orderItems?.reduce((s, i) => s + i.quantity, 0)} units
                    </span>
                    <span className="ml-auto text-base font-semibold"
                          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-3"
                       style={{ borderTop: '1px solid var(--color-soft)' }}>
                    <div className="relative flex-1">
                      <select
                        value={order.status}
                        disabled={updating === order._id}
                        onChange={e => handleStatusUpdate(order._id, e.target.value)}
                        className="w-full text-xs px-3 py-2 appearance-none
                                   pr-7 cursor-pointer border bg-white disabled:opacity-50"
                        style={{ borderColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                        {['pending','processing','shipped','delivered','cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <FiChevronDown size={10}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--color-muted)' }} />
                    </div>
                    <button onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                                 uppercase tracking-wide shrink-0 transition-all duration-200 hover:opacity-80 active:scale-95"
                      style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                      <FiEye size={12} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden lg:block bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                      {['Order ID', 'Customer', 'Products', 'Total', 'Status', 'Date', 'Update', 'View'].map(h => (
                        <th key={h}
                            className="text-left px-5 py-3.5 text-[10px] font-medium
                                       uppercase tracking-[0.15em] whitespace-nowrap"
                            style={{ color: 'var(--color-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order._id}
                          className="transition-colors hover:bg-soft/30"
                          style={{ borderBottom: '1px solid var(--color-soft)' }}>

                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold"
                                style={{ color: 'var(--color-dark)' }}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium"
                             style={{ color: 'var(--color-dark)' }}>
                            {order.user?.name || 'Guest'}
                          </p>
                          <p className="text-xs truncate max-w-32"
                             style={{ color: 'var(--color-muted)' }}>
                            {order.user?.email}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {order.orderItems?.slice(0, 3).map((item, i) => (
                                <div key={i}
                                     className="w-8 h-8 overflow-hidden
                                                border-2 border-white shrink-0"
                                     style={{ backgroundColor: 'var(--color-soft)' }}>
                                  <img src={item.image} alt={item.name}
                                       className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {order.orderItems?.length > 3 && (
                                <div className="w-8 h-8 border-2 border-white
                                                flex items-center justify-center text-xs font-bold"
                                     style={{ backgroundColor: 'var(--color-soft)',
                                              color: 'var(--color-primary)' }}>
                                  +{order.orderItems.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              {order.orderItems?.reduce((s, i) => s + i.quantity, 0)} units
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-sm"
                                style={{ color: 'var(--color-primary)',
                                         fontFamily: 'var(--font-serif)' }}>
                            ₹{order.totalPrice?.toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs whitespace-nowrap"
                                style={{ color: 'var(--color-muted)' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="relative">
                            <select
                              value={order.status}
                              disabled={updating === order._id}
                              onChange={e => handleStatusUpdate(order._id, e.target.value)}
                              className="text-xs px-3 py-2 appearance-none pr-6
                                         cursor-pointer border disabled:opacity-50"
                              style={{ borderColor: 'var(--color-soft)',
                                       color: 'var(--color-dark)',
                                       backgroundColor: 'var(--color-cream)' }}>
                              {['pending','processing','shipped','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <FiChevronDown size={10}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: 'var(--color-muted)' }} />
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <button onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                       uppercase tracking-wide transition-all duration-200 hover:opacity-80 active:scale-95"
                            style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                            <FiEye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleModalStatusUpdate}
        />
      )}
    </div>
  );
}