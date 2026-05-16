import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiTruck, FiXCircle,
  FiPackage, FiSearch, FiTrendingUp, FiBox,
  FiUsers, FiShoppingCart, FiEye, FiChevronDown,
  FiX, FiMapPin, FiCreditCard, FiUser, FiTag, FiMenu,
  FiHome
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const styles = {
    pending:    { bg: '#FEF3C7', color: '#D97706', icon: <FiClock size={11} />       },
    processing: { bg: '#DBEAFE', color: '#2563EB', icon: <FiPackage size={11} />     },
    shipped:    { bg: '#E0E7FF', color: '#7C3AED', icon: <FiTruck size={11} />       },
    delivered:  { bg: '#D1FAE5', color: '#059669', icon: <FiCheckCircle size={11} /> },
    cancelled:  { bg: '#FEE2E2', color: '#DC2626', icon: <FiXCircle size={11} />     },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.icon} {status}
    </span>
  );
};

/* ── Sidebar link ── */
const SideLink = ({ to, icon, label, active, onClick }) => (
  <Link to={to} onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

/* ── Sidebar content ── */
const SidebarContent = ({ onClose }) => (
  <>
    <div className="px-4 mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest"
         style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
      <p className="text-base font-semibold mt-0.5"
         style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
    </div>
    <SideLink to="/admin"          onClick={onClose} icon={<FiTrendingUp size={16} />}   label="Dashboard"      />
    <SideLink to="/admin/products" onClick={onClose} icon={<FiBox size={16} />}          label="Products"       />
    <SideLink to="/admin/orders"   onClick={onClose} icon={<FiShoppingCart size={16} />} label="Orders" active  />
    <SideLink to="/admin/users"    onClick={onClose} icon={<FiUsers size={16} />}        label="Users"          />
    <SideLink to="/admin/coupons"  onClick={onClose} icon={<FiTag size={16} />}          label="Coupons"        />
    <SideLink to="/admin/returns" onClick={onClose} icon={<FiPackage size={16} />} label="Returns" />
    <SideLink to="/admin/home-media" icon={<FiHome size={16} />} label="Home Media" />
    <SideLink to="/admin/home-media" icon={<FiHome size={16} />} label="Home Media" />

    <div className="mt-auto px-4">
      <Link to="/" className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--color-muted)' }}>
        <FiEye size={13} /> View Store
      </Link>
    </div>
  </>
);

/* ══════════════════════════════════════
   ORDER DETAIL MODAL
══════════════════════════════════════ */
const OrderDetailModal = ({ order, onClose, onStatusUpdate }) => {
  const [status, setStatus]     = useState(order.status);
  const [updating, setUpdating] = useState(false);

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
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
           onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl max-h-[95vh]
                        overflow-y-auto rounded-t-3xl"
             style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

          {/* Drag handle — mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full"
                 style={{ backgroundColor: 'var(--color-soft)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 sticky top-0
                          bg-white rounded-t-3xl z-10"
               style={{ borderBottom: '1px solid var(--color-soft)' }}>
            <div>
              <h2 className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                Order Details
              </h2>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-muted)' }}>
                #{order._id.slice(-10).toUpperCase()}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-soft"
              style={{ color: 'var(--color-muted)' }}>
              <FiX size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">

            {/* Status update */}
            <div className="rounded-2xl p-4"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                 style={{ color: 'var(--color-muted)' }}>Update Status</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <StatusBadge status={order.status} />
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className="w-full text-xs rounded-xl px-3 py-2 appearance-none pr-7
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
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white
                               transition-all disabled:opacity-40 hover:opacity-90 shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {updating ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                 style={{ color: 'var(--color-muted)' }}>
                Products Ordered ({order.orderItems?.length})
              </p>
              <div className="space-y-3">
                {order.orderItems?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
                         style={{ backgroundColor: 'white' }}>
                      <img src={item.image} alt={item.name}
                           className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1"
                         style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white"
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
            <div className="rounded-2xl p-4"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
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
                  <span style={{ color: order.shippingPrice === 0 ? '#22c55e' : 'var(--color-dark)' }}>
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
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FiUser size={14} style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest"
                     style={{ color: 'var(--color-muted)' }}>Customer</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center
                                  text-white text-sm font-bold shrink-0"
                       style={{ backgroundColor: 'var(--color-primary)' }}>
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

              <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FiMapPin size={14} style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest"
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
            <div className="rounded-2xl p-4 flex items-center gap-3"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              <FiCreditCard size={16} style={{ color: 'var(--color-primary)' }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest"
                   style={{ color: 'var(--color-muted)' }}>Payment</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-dark)' }}>
                  {order.paymentMethod}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: order.isPaid ? '#D1FAE5' : '#FEF3C7',
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
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating]       = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const statuses = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/orders/admin');
        setOrders(data);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileSidebar && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden"
               onClick={() => setMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-56 bg-white z-50 flex flex-col
                          py-6 px-3 gap-1 lg:hidden"
               style={{ boxShadow: 'var(--shadow-soft)' }}>
            <button onClick={() => setMobileSidebar(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                         rounded-full hover:bg-soft"
              style={{ color: 'var(--color-muted)' }}>
              <FiX size={16} />
            </button>
            <SidebarContent onClose={() => setMobileSidebar(false)} />
          </div>
        </>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)' }}>
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-4 sm:p-6 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button onClick={() => setMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl"
              style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
              <FiMenu size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                Orders
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {filtered.length} of {orders.length} orders
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input type="text" placeholder="Search by order ID, name or email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10 text-sm w-full" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="input text-sm w-full sm:w-44 appearance-none pr-8"
              style={{ color: 'var(--color-dark)' }}>
              {statuses.map(s => (
                <option key={s} value={s}>{s ? s : 'All Statuses'}</option>
              ))}
            </select>
            <FiChevronDown size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted)' }} />
          </div>
        </div>

        {/* Status tabs — horizontal scroll on mobile */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0"
              style={{
                backgroundColor: filterStatus === s ? 'var(--color-primary)' : 'var(--color-soft)',
                color: filterStatus === s ? 'white' : 'var(--color-muted)',
              }}>
              {s || 'All'} ({s ? orders.filter(o => o.status === s).length : orders.length})
            </button>
          ))}
        </div>

        {/* ── TABLE (desktop) / CARDS (mobile) ── */}
        {loading ? (
          <div className="bg-white rounded-2xl p-5 space-y-4"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse items-center">
                <div className="h-10 w-24 rounded-lg"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded-full"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="h-3 w-20 rounded-full"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <FiPackage size={36} style={{ color: 'var(--color-muted)' }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
              No orders found
            </p>
          </div>
        ) : (
          <>
            {/* ── MOBILE CARDS ── */}
            <div className="flex flex-col gap-3 lg:hidden">
              {filtered.map(order => (
                <div key={order._id} className="bg-white rounded-2xl p-4"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
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
                        <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border-2
                                                border-white shrink-0"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <img src={item.image} alt={item.name}
                               className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.orderItems?.length > 3 && (
                        <div className="w-8 h-8 rounded-lg border-2 border-white
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
                    {/* Status update */}
                    <div className="relative flex-1">
                      <select
                        value={order.status}
                        disabled={updating === order._id}
                        onChange={e => handleStatusUpdate(order._id, e.target.value)}
                        className="w-full text-xs rounded-xl px-3 py-2 appearance-none
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
                    {/* View button */}
                    <button onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                 text-xs font-medium shrink-0 transition-all hover:opacity-80"
                      style={{ backgroundColor: 'var(--color-soft)',
                               color: 'var(--color-primary)' }}>
                      <FiEye size={12} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden lg:block bg-white rounded-2xl overflow-hidden"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                      {['Order ID', 'Customer', 'Products', 'Total', 'Status', 'Date', 'Update', 'View'].map(h => (
                        <th key={h}
                            className="text-left px-5 py-3.5 text-xs font-semibold
                                       uppercase tracking-widest whitespace-nowrap"
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
                                     className="w-8 h-8 rounded-lg overflow-hidden
                                                border-2 border-white shrink-0"
                                     style={{ backgroundColor: 'var(--color-soft)' }}>
                                  <img src={item.image} alt={item.name}
                                       className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {order.orderItems?.length > 3 && (
                                <div className="w-8 h-8 rounded-lg border-2 border-white
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
                              className="text-xs rounded-xl px-3 py-2 appearance-none pr-6
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                       text-xs font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: 'var(--color-soft)',
                                     color: 'var(--color-primary)' }}>
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