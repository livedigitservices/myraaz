import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiPackage, FiHeart, FiShoppingCart, FiUser,
  FiChevronRight, FiClock, FiCheckCircle,
  FiTruck, FiXCircle, FiBox, FiEdit2, FiCreditCard
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth }     from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart }     from '../../context/CartContext';

/* ── Status badge — outlined, keeps semantic color per status ── */
const StatusBadge = ({ status }) => {
  const styles = {
    pending:    { color: '#D97706', icon: <FiClock size={11} />       },
    processing: { color: '#2563EB', icon: <FiBox size={11} />         },
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

/* ── Sidebar link — hairline indicator instead of filled pill ── */
const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
    style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)', fontWeight: active ? 600 : 400 }}>
    <span
      className={`block h-px transition-all duration-300 ${active ? 'w-3' : 'w-0 group-hover:w-3'}`}
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>{icon}</span>
    {label}
  </Link>
);

/* ── Eyebrow — flanked-line label used across the site ── */
const Eyebrow = ({ children }) => (
  <div className="flex items-center gap-2.5">
    <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
    <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
      {children}
    </p>
  </div>
);

export default function UserDashboard() {
  const { userInfo }              = useAuth();
  const { wishlist }              = useWishlist();
  const { cartItems, totalItems } = useCart();
  const { pathname }              = useLocation();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/mine');
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const delivered  = orders.filter(o => o.status === 'delivered').length;
  const pending    = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.totalPrice, 0);

  const stats = [
    { icon: <FiPackage size={18} />,      label: 'Total Orders', value: orders.length,                            to: '/dashboard/orders' },
    { icon: <FiCheckCircle size={18} />,  label: 'Delivered',    value: delivered,                                 to: '/dashboard/orders' },
    { icon: <FiClock size={18} />,        label: 'In Progress',  value: pending,                                   to: '/dashboard/orders' },
    { icon: <FiHeart size={18} />,        label: 'Wishlist',     value: wishlist.length,                           to: '/wishlist'         },
    { icon: <FiShoppingCart size={18} />, label: 'Cart Items',   value: totalItems,                                to: '/cart'             },
    { icon: <FiTruck size={18} />,        label: 'Total Spent',  value: `₹${totalSpent.toLocaleString('en-IN')}`, to: '/dashboard/orders' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── SIDEBAR (desktop only) ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-8 px-4 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>

        <div className="flex flex-col items-center px-4 mb-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl
                          font-bold text-white mb-3"
               style={{ backgroundColor: 'var(--color-dark)' }}>
            {userInfo?.name?.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold line-clamp-1"
             style={{ color: 'var(--color-dark)' }}>{userInfo?.name}</p>
          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {userInfo?.email}
          </p>
        </div>

        <p className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
           style={{ color: 'var(--color-accent)' }}>My Account</p>
        <SideLink to="/dashboard"         icon={<FiUser size={16} />}       label="Overview"     active={pathname === '/dashboard'} />
        <SideLink to="/dashboard/orders"  icon={<FiPackage size={16} />}    label="My Orders"    active={pathname === '/dashboard/orders'} />
        <SideLink to="/dashboard/profile" icon={<FiEdit2 size={16} />}      label="Edit Profile" active={pathname === '/dashboard/profile'} />
        <SideLink to="/dashboard/wallet"  icon={<FiCreditCard size={16} />} label="Wallet"       active={pathname === '/dashboard/wallet'} />

        <p className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] mt-6 mb-2"
           style={{ color: 'var(--color-accent)' }}>Shopping</p>
        <SideLink to="/wishlist" icon={<FiHeart size={16} />}        label="Wishlist" active={pathname === '/wishlist'} />
        <SideLink to="/cart"     icon={<FiShoppingCart size={16} />} label="Cart"     active={pathname === '/cart'} />
        <SideLink to="/products" icon={<FiBox size={16} />}          label="Shop"     active={pathname === '/products'} />
      </aside>

      {/* ── MAIN — pb-24 on mobile so content clears the fixed bottom nav ── */}
      <main className="flex-1 p-6 pb-24 lg:pb-6 max-w-4xl">

        <div className="mb-8">
          <Eyebrow>Welcome back</Eyebrow>
          <h1 className="text-2xl font-semibold mt-2"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Hello, {userInfo?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Here's an overview of your account activity.
          </p>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px mb-8" style={{ backgroundColor: 'var(--color-soft)' }}>
          {stats.map(({ icon, label, value, to }) => (
            <Link key={label} to={to}
              className="group relative bg-white p-4 flex items-center gap-3 transition-all duration-300"
              style={{ borderTop: '2px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderTopColor = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                              transition-transform group-hover:scale-110"
                   style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{label}</p>
                <p className="text-lg font-semibold truncate"
                   style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                  {value}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── RECENT ORDERS ── */}
        <div className="bg-white overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
          <div className="flex items-center justify-between px-5 py-4"
               style={{ borderBottom: '1px solid var(--color-soft)' }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-dark)' }}>
              Recent Orders
            </p>
            <Link to="/dashboard/orders"
                  className="text-xs flex items-center gap-1 hover:gap-2 transition-all"
                  style={{ color: 'var(--color-primary)' }}>
              View all <FiChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse items-center">
                  <div className="h-12 w-12 shrink-0" style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                   style={{ border: '1px solid var(--color-accent)' }}>
                <FiPackage size={26} style={{ color: 'var(--color-accent)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>No orders yet</p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                Your order history will appear here
              </p>
              <Link to="/products" className="btn-primary text-xs px-5 py-2">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-soft)' }}>
              {orders.slice(0, 5).map(order => (
                <div key={order._id}
                     className="flex items-center justify-between px-5 py-4 gap-4
                                hover:bg-soft/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      {order.orderItems?.[0]?.image ? (
                        <img src={order.orderItems[0].image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiBox size={16} style={{ color: 'var(--color-muted)' }} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium" style={{ color: 'var(--color-dark)' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {order.orderItems?.length} item(s) ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-sm font-semibold"
                       style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── WISHLIST PREVIEW ── */}
        {wishlist.length > 0 && (
          <div className="bg-white overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: 'var(--color-dark)' }}>
                <FiHeart size={13} fill="var(--color-accent)" color="var(--color-accent)" />
                Saved Items
              </p>
              <Link to="/wishlist"
                    className="text-xs flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: 'var(--color-primary)' }}>
                View all <FiChevronRight size={12} />
              </Link>
            </div>
            <div className="p-5 flex gap-3 overflow-x-auto pb-5">
              {wishlist.slice(0, 5).map(item => (
                <Link key={item._id} to={`/products/${item._id}`} className="shrink-0 group">
                  <div className="w-20 h-20 overflow-hidden mb-2"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={item.image} alt={item.name}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <p className="text-xs line-clamp-2 w-20 leading-tight"
                     style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                  <p className="text-xs font-semibold mt-0.5"
                     style={{ color: 'var(--color-primary)' }}>₹{item.price}</p>
                </Link>
              ))}
              {wishlist.length > 5 && (
                <Link to="/wishlist"
                      className="shrink-0 w-20 h-20 flex items-center justify-center text-xs font-medium"
                      style={{ border: '1px solid var(--color-soft)', color: 'var(--color-primary)' }}>
                  +{wishlist.length - 5} more
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── CART PREVIEW ── */}
        {cartItems.length > 0 && (
          <div className="bg-white overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: 'var(--color-dark)' }}>
                <FiShoppingCart size={13} style={{ color: 'var(--color-accent)' }} />
                Cart ({totalItems} items)
              </p>
              <Link to="/cart"
                    className="text-xs flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: 'var(--color-primary)' }}>
                View cart <FiChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-soft)' }}>
              {cartItems.slice(0, 3).map(item => (
                <div key={item._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-10 h-10 overflow-hidden shrink-0"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1"
                       style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0"
                     style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-soft)' }}>
              <Link to="/cart"
                    className="w-full flex items-center justify-center gap-2 py-3
                               text-white text-xs font-medium uppercase tracking-wider transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-dark)' }}>
                <FiShoppingCart size={14} /> Go to Cart
              </Link>
            </div>
          </div>
        )}

        {/* ── QUICK LINKS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-soft)' }}>
          {[
            { to: '/dashboard/profile', icon: <FiEdit2 size={17} />,       label: 'Edit Profile',  sub: 'Update your details'   },
            { to: '/dashboard/orders',  icon: <FiPackage size={17} />,      label: 'Order History', sub: 'Track all your orders'  },
            { to: '/products',          icon: <FiShoppingCart size={17} />, label: 'Shop Now',      sub: 'Explore our collection' },
          ].map(({ to, icon, label, sub }) => (
            <Link key={to} to={to}
              className="group relative bg-white p-5 flex items-center gap-4 transition-all duration-300"
              style={{ borderTop: '2px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderTopColor = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0
                              transition-transform group-hover:scale-110"
                   style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}