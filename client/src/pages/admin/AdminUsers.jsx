import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiUsers, FiSearch, FiTrash2, FiShield,
  FiShieldOff, FiTrendingUp, FiBox,
  FiShoppingCart, FiEye, FiUser,
  FiPackage, FiHome, FiTag,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Eyebrow — flanked-line label used across the site ── */
const Eyebrow = ({ children }) => (
  <div className="flex items-center gap-2.5">
    <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
    <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
      {children}
    </p>
  </div>
);

/* ── Sidebar link — hairline indicator, matches Dashboard/UserDashboard ── */
const SideLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
    style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)', fontWeight: active ? 600 : 400 }}
  >
    <span
      className={`block h-px transition-all duration-300 ${active ? 'w-3' : 'w-0 group-hover:w-3'}`}
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>{icon}</span>
    {label}
  </Link>
);

const NAV_LINKS = [
  { to: '/admin',            icon: <FiTrendingUp size={16} />,   label: 'Dashboard'  },
  { to: '/admin/products',   icon: <FiBox size={16} />,          label: 'Products'   },
  { to: '/admin/orders',     icon: <FiShoppingCart size={16} />, label: 'Orders'     },
  { to: '/admin/users',      icon: <FiUsers size={16} />,        label: 'Users'      },
  { to: '/admin/coupons',    icon: <FiTag size={16} />,          label: 'Coupons'    },
  { to: '/admin/returns',    icon: <FiPackage size={16} />,      label: 'Returns'    },
  { to: '/admin/home-media', icon: <FiHome size={16} />,         label: 'Home Media' },
];

export default function AdminUsers() {
  const { userInfo }            = useAuth();
  const { pathname }             = useLocation();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [acting, setActing]     = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users/admin');
        setUsers(data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      setActing(id);
      await api.delete(`/users/admin/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActing(null);
    }
  };

  const handleToggleAdmin = async (id, name, isAdmin) => {
    if (!window.confirm(`${isAdmin ? 'Remove admin from' : 'Make admin'} "${name}"?`)) return;
    try {
      setActing(id);
      await api.put(`/users/admin/${id}/toggle-admin`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isAdmin: !u.isAdmin } : u));
      toast.success(`${name} is now ${isAdmin ? 'a regular user' : 'an admin'}`);
    } catch {
      toast.error('Failed to update user');
    } finally {
      setActing(null);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter(u => u.isAdmin).length;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── SIDEBAR (desktop only — mobile uses the shared AdminMobileBottomNav) ── */}
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
        {NAV_LINKS.map(({ to, icon, label }) => (
          <SideLink key={to} to={to} icon={icon} label={label} active={pathname === to} />
        ))}

        <div className="mt-auto px-4 pt-4" style={{ borderTop: '1px solid var(--color-soft)' }}>
          <Link to="/" className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      {/* ── Main content — pb-24 on mobile so content clears the fixed bottom nav ── */}
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 min-w-0">

        {/* Header */}
        <div className="mb-6">
          <Eyebrow>User Management</Eyebrow>
          <h1 className="text-2xl font-semibold mt-2"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Users
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {users.length} total · {admins} admins · {users.length - admins} customers
          </p>
        </div>

        {/* Search — hairline underline, matches ProductsList */}
        <div className="relative mb-6 max-w-sm">
          <FiSearch size={15} className="absolute left-1 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }} />
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent focus:outline-none"
            style={{ borderBottom: '1.5px solid var(--color-soft)', color: 'var(--color-dark)' }}
            onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--color-accent)'}
            onBlur={e => e.currentTarget.style.borderBottomColor = 'var(--color-soft)'}
          />
        </div>

        {/* Table / Cards */}
        <div className="bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse items-center">
                  <div className="w-10 h-10 rounded-full"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-48 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                   style={{ border: '1px solid var(--color-accent)' }}>
                <FiUsers size={26} style={{ color: 'var(--color-accent)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                No users found
              </p>
            </div>
          ) : (
            <>
              {/* ── Desktop table (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                      {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h}
                            className="text-left px-5 py-3.5 text-[10px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: 'var(--color-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user._id}
                          className="transition-colors hover:bg-soft/30"
                          style={{ borderBottom: '1px solid var(--color-soft)' }}>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center
                                            text-sm font-bold text-white shrink-0"
                                 style={{ backgroundColor: user.isAdmin
                                   ? 'var(--color-accent)' : 'var(--color-dark)' }}>
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-medium text-sm" style={{ color: 'var(--color-dark)' }}>
                              {user.name}
                              {user._id === userInfo?._id && (
                                <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5"
                                      style={{ border: '1px solid var(--color-soft)',
                                               color: 'var(--color-muted)' }}>you</span>
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            {user.email}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {user.isAdmin ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide w-fit"
                                  style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                              <FiShield size={11} /> Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide w-fit"
                                  style={{ border: '1px solid var(--color-soft)', color: 'var(--color-muted)' }}>
                              <FiUser size={11} /> Customer
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {user._id !== userInfo?._id && (
                              <>
                                <button
                                  onClick={() => handleToggleAdmin(user._id, user.name, user.isAdmin)}
                                  disabled={acting === user._id}
                                  title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                                  className="p-2 transition-all hover:bg-amber-50 disabled:opacity-40"
                                  style={{ color: '#D97706' }}>
                                  {user.isAdmin ? <FiShieldOff size={15} /> : <FiShield size={15} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(user._id, user.name)}
                                  disabled={acting === user._id}
                                  className="p-2 transition-all hover:bg-red-50 disabled:opacity-40"
                                  style={{ color: '#EF4444' }}
                                  title="Delete user">
                                  <FiTrash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (< md) ── */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-soft)' }}>
                {filtered.map(user => (
                  <div key={user._id} className="p-4 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center
                                    text-sm font-bold text-white shrink-0"
                         style={{ backgroundColor: user.isAdmin
                           ? 'var(--color-accent)' : 'var(--color-dark)' }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm" style={{ color: 'var(--color-dark)' }}>
                          {user.name}
                        </p>
                        {user._id === userInfo?._id && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5"
                                style={{ border: '1px solid var(--color-soft)', color: 'var(--color-muted)' }}>
                            you
                          </span>
                        )}
                        {user.isAdmin ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
                                style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                            <FiShield size={10} /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs uppercase tracking-wide"
                                style={{ border: '1px solid var(--color-soft)', color: 'var(--color-muted)' }}>
                            <FiUser size={10} /> Customer
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {user.email}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        Joined {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    {user._id !== userInfo?._id && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleAdmin(user._id, user.name, user.isAdmin)}
                          disabled={acting === user._id}
                          title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                          className="p-2 transition-all hover:bg-amber-50 disabled:opacity-40"
                          style={{ color: '#D97706' }}>
                          {user.isAdmin ? <FiShieldOff size={15} /> : <FiShield size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          disabled={acting === user._id}
                          className="p-2 transition-all hover:bg-red-50 disabled:opacity-40"
                          style={{ color: '#EF4444' }}>
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}