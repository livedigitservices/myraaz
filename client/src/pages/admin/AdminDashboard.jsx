import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiPackage, FiUsers, FiShoppingCart, FiTrendingUp,
  FiPlus, FiEye, FiClock, FiCheckCircle, FiTruck,
  FiXCircle, FiArrowRight, FiBox, FiAlertCircle, FiTag,
  FiHome,
} from 'react-icons/fi';
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

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, sub, color, to }) => (
  <Link to={to}
    className="bg-white rounded-2xl p-5 flex items-start justify-between
               transition-all duration-300 hover:-translate-y-1 group"
    style={{ boxShadow: 'var(--shadow-card)' }}>
    <div>
      <p className="text-xs font-medium uppercase tracking-widest mb-3"
         style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="text-3xl font-semibold mb-1"
         style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
    </div>
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center
                    transition-transform group-hover:scale-110"
         style={{ backgroundColor: color + '18', color }}>
      {icon}
    </div>
  </Link>
);

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 animate-pulse"
       style={{ boxShadow: 'var(--shadow-card)' }}>
    <div className="h-3 w-20 rounded-full mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
    <div className="h-8 w-24 rounded-full mb-2" style={{ backgroundColor: 'var(--color-soft)' }} />
    <div className="h-3 w-16 rounded-full"       style={{ backgroundColor: 'var(--color-soft)' }} />
  </div>
);

/* ── Sidebar link ── */
const SideLink = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                 transition-all duration-150"
      style={{
        backgroundColor: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'white' : 'var(--color-muted)',
      }}>
      {icon} {label}
    </Link>
  );
};

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get('/orders/admin/stats');
        setStats(data);
      } catch {
        setStats({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, recentOrders: [] });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── SIDEBAR (desktop only) ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16 h-[calc(100vh-64px)]
                        border-r py-6 px-3 gap-1"
             style={{ borderColor: 'var(--color-soft)', boxShadow: 'var(--shadow-card)' }}>

        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>

        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>Overview</p>
        <SideLink to="/admin"            icon={<FiTrendingUp size={16} />}   label="Dashboard"  />

        {/* <p className="px-4 text-xs font-semibold uppercase tracking-widest mt-4 mb-1"
           style={{ color: 'var(--color-muted)' }}>Manage</p> */}
        <SideLink to="/admin/products"   icon={<FiBox size={16} />}          label="Products"   />
        <SideLink to="/admin/orders"     icon={<FiShoppingCart size={16} />} label="Orders"     />
        <SideLink to="/admin/users"      icon={<FiUsers size={16} />}        label="Users"      />
        <SideLink to="/admin/coupons"    icon={<FiTag size={16} />}          label="Coupons"    />
        <SideLink to="/admin/returns"    icon={<FiPackage size={16} />}      label="Returns"    />
        <SideLink to="/admin/home-media" icon={<FiHome size={16} />}         label="Home Media" />

        <div className="mt-auto px-4">
          <Link to="/"
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      {/* ── MAIN — pb-24 on mobile so content clears the fixed bottom nav ── */}
      <main className="flex-1 p-6 max-w-5xl pb-24 lg:pb-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Welcome back! Here's what's happening.
            </p>
          </div>
          <Link to="/admin/products/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white
                       text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiPlus size={15} /> Add Product
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" 
        style={{
    backgroundColor: 'var(--color-soft)',  
    boxShadow: 'var(--shadow-card)',
  }}  >
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                icon={<FiShoppingCart size={20} />} label="Total Orders"
                value={stats.totalOrders} sub="All time orders"
                color="#7C6A5E" to="/admin/orders"
              />
              <StatCard
                icon={<FiTrendingUp size={20} />} label="Revenue"
                value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
                sub="From delivered orders only"
                color="#D4AF8C" to="/admin/orders"
              />
              <StatCard
                icon={<FiClock size={20} />} label="Pending"
                value={stats.pendingOrders} sub="Need attention"
                color="#F59E0B" to="/admin/orders"
              />
              <StatCard
                icon={<FiPackage size={20} />} label="Products"
                value={stats.totalProducts || '—'} sub="In catalogue"
                color="#7C3AED" to="/admin/products"
              />
            </>
          )}
        </div>

        {/* ── RECENT ORDERS + QUICK ACTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{
    backgroundColor: 'var(--color-soft)',  
    boxShadow: 'var(--shadow-card)',
  }}>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden"
               >
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                Recent Orders
              </h2>
              <Link to="/admin/orders"
                    className="text-xs flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: 'var(--color-primary)' }}>
                View all <FiArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-10 w-28 rounded-lg" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-5">
                <FiAlertCircle size={32} style={{ color: 'var(--color-muted)' }} className="mb-3" />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                  No orders yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Orders will appear here once customers start purchasing.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-soft)' }}>
                {stats.recentOrders.map(order => (
                  <div key={order._id}
                       className="flex items-center justify-between px-5 py-3.5
                                  hover:bg-soft/40 transition-colors gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium truncate"
                         style={{ color: 'var(--color-dark)' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {order.user?.name || 'Guest'} · {order.orderItems?.length} item(s)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold mb-1"
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

          {/* Quick Actions */}
          <div className="flex flex-col gap-4" style={{
    backgroundColor: 'var(--color-soft)',  
    boxShadow: 'var(--shadow-card)',
  }}>
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
                Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  { to: '/admin/products/add', icon: <FiPlus size={15} />,         label: 'Add New Product',  color: 'var(--color-primary)' },
                  { to: '/admin/products',     icon: <FiBox size={15} />,          label: 'Manage Products',  color: 'var(--color-accent)'  },
                  { to: '/admin/orders',       icon: <FiShoppingCart size={15} />, label: 'View Orders',      color: '#7C3AED'              },
                  { to: '/admin/users',        icon: <FiUsers size={15} />,        label: 'Manage Users',     color: '#0EA5E9'              },
                  { to: '/',                   icon: <FiEye size={15} />,          label: 'View Storefront',  color: '#22C55E'              },
                ].map(({ to, icon, label, color }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm
                               transition-all hover:translate-x-1"
                    style={{ color: 'var(--color-dark)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                         style={{ backgroundColor: color + '18', color }}>
                      {icon}
                    </div>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips card */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
                 style={{ backgroundColor: 'var(--color-primary)' }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 bg-white" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
                Pro tip
              </p>
              <p className="text-sm text-white font-medium leading-relaxed relative z-10">
                Add high-quality images to your products to increase conversion by up to 40%.
              </p>
              <Link to="/admin/products/add"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-medium
                               text-white/80 hover:text-white transition-colors">
                Add product <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}