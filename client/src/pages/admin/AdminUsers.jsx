import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiSearch, FiTrash2, FiShield,
  FiShieldOff, FiTrendingUp, FiBox,
  FiShoppingCart, FiEye, FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiTag } from 'react-icons/fi';

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

export default function AdminUsers() {
  const { userInfo }          = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [acting, setActing]   = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/users/admin');
        setUsers(data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
    if (!window.confirm(
      `${isAdmin ? 'Remove admin from' : 'Make admin'} "${name}"?`
    )) return;
    try {
      setActing(id);
      await api.put(`/users/admin/${id}/toggle-admin`);
      setUsers(prev => prev.map(u =>
        u._id === id ? { ...u, isAdmin: !u.isAdmin } : u
      ));
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
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}   label="Dashboard"     />
        <SideLink to="/admin/products" icon={<FiBox size={16} />}          label="Products"      />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />} label="Orders"        />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}        label="Users" active  />
        <SideLink to="/admin/coupons" icon={<FiTag size={16} />} label="Coupons" />
        <div className="mt-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Users
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {users.length} total · {admins} admins · {users.length - admins} customers
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }} />
          <input type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10 text-sm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>
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
              <FiUsers size={36} style={{ color: 'var(--color-muted)' }} className="mb-3" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                No users found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                             uppercase tracking-widest"
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
                                 ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-sm" style={{ color: 'var(--color-dark)' }}>
                            {user.name}
                            {user._id === userInfo?._id && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: 'var(--color-soft)',
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
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                           text-xs font-medium w-fit"
                                style={{ backgroundColor: '#FEF3E2', color: 'var(--color-accent)' }}>
                            <FiShield size={11} /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                           text-xs font-medium w-fit"
                                style={{ backgroundColor: 'var(--color-soft)',
                                         color: 'var(--color-muted)' }}>
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
                                className="p-2 rounded-xl transition-all hover:bg-amber-50
                                           disabled:opacity-40"
                                style={{ color: '#F59E0B' }}>
                                {user.isAdmin
                                  ? <FiShieldOff size={15} />
                                  : <FiShield size={15} />}
                              </button>
                              <button
                                onClick={() => handleDelete(user._id, user.name)}
                                disabled={acting === user._id}
                                className="p-2 rounded-xl transition-all hover:bg-red-50
                                           disabled:opacity-40"
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
          )}
        </div>
      </main>
    </div>
  );
}