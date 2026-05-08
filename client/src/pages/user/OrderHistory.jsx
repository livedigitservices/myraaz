import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiClock, FiCheckCircle, FiTruck,
  FiXCircle, FiBox, FiChevronDown, FiChevronUp,
  FiHeart, FiShoppingCart, FiEdit2, FiUser
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
  const styles = {
    pending:    { bg: '#FEF3C7', color: '#D97706', icon: <FiClock size={11} />       },
    processing: { bg: '#DBEAFE', color: '#2563EB', icon: <FiBox size={11} />         },
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

/* ── Progress tracker ── */
const OrderProgress = ({ status }) => {
  const steps = ['pending', 'processing', 'shipped', 'delivered'];
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
    <div className="flex items-center gap-0 py-3 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                             font-bold transition-all ${i <= current ? 'text-white' : ''}`}
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
            <div className="w-12 sm:w-20 h-0.5 mx-1 mb-4 shrink-0 transition-all"
                 style={{
                   backgroundColor: i < current ? 'var(--color-primary)' : 'var(--color-soft)'
                 }} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Order Card ── */
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer
                      hover:bg-soft/30 transition-colors"
           onClick={() => setExpanded(!expanded)}
           style={{ borderBottom: expanded ? '1px solid var(--color-soft)' : 'none' }}>
        <div className="flex items-center gap-3 min-w-0">
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
            : <FiChevronDown size={16} style={{ color: 'var(--color-muted)' }} />
          }
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5">

          {/* Progress */}
          <OrderProgress status={order.status} />

          {/* Divider */}
          <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

          {/* Items */}
          <div className="space-y-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest"
               style={{ color: 'var(--color-muted)' }}>Items Ordered</p>
            {order.orderItems?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <img src={item.image} alt={item.name}
                       className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product}`}>
                    <p className="text-sm font-medium line-clamp-1 hover:underline"
                       style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                  </Link>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0"
                   style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

          {/* Shipping + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
           <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-soft)' }}>
  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
     style={{ color: 'var(--color-muted)' }}>Shipping To</p>
  <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
    {order.shippingAddress?.fullName || order.user?.name}
  </p>
  <p className="text-xs mt-0.5 flex items-center gap-1"
     style={{ color: 'var(--color-muted)' }}>
    📱 {order.shippingAddress?.phone || '—'}
  </p>
  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
    {order.shippingAddress?.address}
  </p>
  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
    {order.shippingAddress?.city}, {order.shippingAddress?.state} —{' '}
    {order.shippingAddress?.pincode}
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
                {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString('en-IN')}` : 'Payment pending'}
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
              <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

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

export default function OrderHistory() {
  const { userInfo }            = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

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

  const filtered = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1"
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
            {userInfo?.email}
          </p>
        </div>
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>My Account</p>
        <SideLink to="/dashboard"         icon={<FiUser size={16} />}       label="Overview"     />
        <SideLink to="/dashboard/orders"  icon={<FiPackage size={16} />}    label="My Orders"   active />
        <SideLink to="/dashboard/profile" icon={<FiEdit2 size={16} />}      label="Edit Profile" />
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mt-4 mb-1"
           style={{ color: 'var(--color-muted)' }}>Shopping</p>
        <SideLink to="/wishlist"  icon={<FiHeart size={16} />}        label="Wishlist" />
        <SideLink to="/cart"      icon={<FiShoppingCart size={16} />} label="Cart"     />
        <SideLink to="/products"  icon={<FiBox size={16} />}          label="Shop"     />
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 max-w-3xl">
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: filterStatus === s ? 'var(--color-primary)' : 'var(--color-soft)',
                color: filterStatus === s ? 'white' : 'var(--color-muted)',
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
                  <div className="w-11 h-11 rounded-xl" style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
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
              {filterStatus ? `No ${filterStatus} orders` : 'No orders yet'}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
              {filterStatus ? 'Try a different filter' : 'Place your first order today!'}
            </p>
            {!filterStatus && (
              <Link to="/products" className="btn-primary text-xs px-5 py-2">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}