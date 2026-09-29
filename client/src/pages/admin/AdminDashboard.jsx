import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiPackage, FiUsers, FiShoppingCart, FiTrendingUp,
  FiPlus, FiEye, FiClock, FiCheckCircle, FiTruck,
  FiXCircle, FiArrowRight, FiBox, FiAlertCircle, FiTag,
  FiHome, FiGift,
} from 'react-icons/fi';
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

/* ── Stat Card — outlined gold icon instead of a colored translucent box ── */
const StatCard = ({ icon, label, value, sub, to }) => (
  <Link to={to}
    className="group relative bg-white p-5 flex items-start justify-between transition-all duration-300"
    style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid transparent' }}
    onMouseEnter={e => { e.currentTarget.style.borderTopColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderTopColor = 'transparent'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-3"
         style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="text-3xl font-semibold mb-1"
         style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
    </div>
    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0
                    transition-transform group-hover:scale-110"
         style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
      {icon}
    </div>
  </Link>
);

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="bg-white p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-card)' }}>
    <div className="h-3 w-20 rounded-full mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
    <div className="h-8 w-24 rounded-full mb-2" style={{ backgroundColor: 'var(--color-soft)' }} />
    <div className="h-3 w-16 rounded-full"       style={{ backgroundColor: 'var(--color-soft)' }} />
  </div>
);

/* ── Sidebar link — hairline indicator, matches UserDashboard ── */
const SideLink = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to}
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
                        border-r py-8 px-4 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>

        <div className="px-4 mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
            Admin Panel
          </p>
          <p className="text-base font-semibold mt-1"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>

        <p className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
           style={{ color: 'var(--color-accent)' }}>Overview</p>
        <SideLink to="/admin"            icon={<FiTrendingUp size={16} />}   label="Dashboard"  />

        <p className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] mt-6 mb-2"
           style={{ color: 'var(--color-accent)' }}>Manage</p>
        <SideLink to="/admin/products"   icon={<FiBox size={16} />}          label="Products"   />
        <SideLink to="/admin/orders"     icon={<FiShoppingCart size={16} />} label="Orders"     />
        <SideLink to="/admin/users"      icon={<FiUsers size={16} />}        label="Users"      />
        <SideLink to="/admin/coupons"    icon={<FiTag size={16} />}          label="Coupons"    />
        <SideLink to="/admin/returns"    icon={<FiPackage size={16} />}      label="Returns"    />
        <SideLink to="/admin/home-media" icon={<FiHome size={16} />}         label="Home Media" />
        <SideLink to="/admin/delivery"     icon={<FiTruck size={16} />}        label="Delivery"      />
        <SideLink to="/admin/combo-offers" icon={<FiGift size={16} />}         label="Combo Offers"  />

        <div className="mt-auto px-4 pt-4" style={{ borderTop: '1px solid var(--color-soft)' }}>
          <Link to="/"
            className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      {/* ── MAIN — pb-24 on mobile so content clears the fixed bottom nav ── */}
      <main className="flex-1 p-6 max-w-5xl pb-24 lg:pb-6">

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Eyebrow>Admin Overview</Eyebrow>
            <h1 className="text-2xl font-semibold mt-2"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Welcome back! Here's what's happening.
            </p>
          </div>
          <Link to="/admin/products/add"
            className="flex items-center gap-2 px-6 py-3 text-white
                       text-xs font-medium uppercase tracking-wider transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-dark)' }}>
            <FiPlus size={15} /> Add Product
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-8" style={{ backgroundColor: 'var(--color-soft)' }}>
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                icon={<FiShoppingCart size={19} />} label="Total Orders"
                value={stats.totalOrders} sub="All time orders"
                to="/admin/orders"
              />
              <StatCard
                icon={<FiTrendingUp size={19} />} label="Revenue"
                value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
                sub="From delivered orders only"
                to="/admin/orders"
              />
              <StatCard
                icon={<FiClock size={19} />} label="Pending"
                value={stats.pendingOrders} sub="Need attention"
                to="/admin/orders"
              />
              <StatCard
                icon={<FiPackage size={19} />} label="Products"
                value={stats.totalProducts || '—'} sub="In catalogue"
                to="/admin/products"
              />
            </>
          )}
        </div>

        {/* ── RECENT ORDERS + QUICK ACTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-dark)' }}>
                Recent Orders
              </p>
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
                    <div className="h-10 w-28" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                     style={{ border: '1px solid var(--color-accent)' }}>
                  <FiAlertCircle size={26} style={{ color: 'var(--color-accent)' }} />
                </div>
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
          <div className="flex flex-col gap-6">
            <div className="bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] mb-5" style={{ color: 'var(--color-dark)' }}>
                Quick Actions
              </p>
              <div className="space-y-1">
                {[
                  { to: '/admin/products/add', icon: <FiPlus size={15} />,         label: 'Add New Product'  },
                  { to: '/admin/products',     icon: <FiBox size={15} />,          label: 'Manage Products'  },
                  { to: '/admin/orders',       icon: <FiShoppingCart size={15} />, label: 'View Orders'      },
                  { to: '/admin/users',        icon: <FiUsers size={15} />,        label: 'Manage Users'     },
                  { to: '/',                   icon: <FiEye size={15} />,          label: 'View Storefront'  },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to}
                    className="group flex items-center gap-3 py-2.5 text-sm transition-all hover:translate-x-1"
                    style={{ color: 'var(--color-dark)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                         style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                      {icon}
                    </div>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips card */}
            <div className="p-5 relative overflow-hidden" style={{ backgroundColor: 'var(--color-dark)' }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] bg-white" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-[0.06] bg-white" />
              <div className="flex items-center gap-2.5 mb-3 relative z-10">
                <span style={{ width: '16px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
                <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
                  Pro tip
                </p>
              </div>
              <p className="text-sm text-white font-medium leading-relaxed relative z-10">
                Add high-quality images to your products to increase conversion by up to 40%.
              </p>
              <Link to="/admin/products/add"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-medium relative z-10 transition-colors"
                    style={{ color: 'var(--color-accent)' }}>
                Add product <FiArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}