import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiPhone, FiMapPin,
  FiEye, FiEyeOff, FiCheck, FiPackage,
  FiHeart, FiShoppingCart, FiBox, FiEdit2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

export default function EditProfile() {
  const { userInfo, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name:     userInfo?.name    || '',
    email:    userInfo?.email   || '',
    phone:    userInfo?.phone   || '',
    password: '',
    confirm:  '',
    address:  userInfo?.defaultAddress?.address || '',
    city:     userInfo?.defaultAddress?.city    || '',
    state:    userInfo?.defaultAddress?.state   || '',
    pincode:  userInfo?.defaultAddress?.pincode || '',
  });

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm)
      return toast.error('Passwords do not match');
    if (form.password && form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    try {
      setLoading(true);
      const payload = {
        name:  form.name,
        email: form.email,
        phone: form.phone,
        defaultAddress: {
          address: form.address,
          city:    form.city,
          state:   form.state,
          pincode: form.pincode,
        },
      };
      if (form.password) payload.password = form.password;

      const { data } = await api.put('/users/profile', payload);

      // Update local auth state
      login({ ...userInfo, name: data.name, email: data.email });
      setSaved(true);
      toast.success('Profile updated! ✅');
      setTimeout(() => setSaved(false), 3000);
      setForm(f => ({ ...f, password: '', confirm: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fields = {
    personal: [
      { name: 'name',  label: 'Full Name',       icon: <FiUser size={15} />,  type: 'text',  placeholder: 'Your full name'    },
      { name: 'email', label: 'Email Address',    icon: <FiMail size={15} />,  type: 'email', placeholder: 'your@email.com'    },
      { name: 'phone', label: 'Phone Number',     icon: <FiPhone size={15} />, type: 'tel',   placeholder: '+91 9876543210'    },
    ],
    address: [
      { name: 'address', label: 'Street Address', icon: <FiMapPin size={15} />, type: 'text', placeholder: '123, Main Street', col: 2 },
      { name: 'city',    label: 'City',           icon: null, type: 'text', placeholder: 'Mumbai',     col: 1 },
      { name: 'state',   label: 'State',          icon: null, type: 'text', placeholder: 'Maharashtra', col: 1 },
      { name: 'pincode', label: 'Pincode',        icon: null, type: 'text', placeholder: '400001',      col: 1 },
    ],
  };

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
          <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
            {userInfo?.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{userInfo?.email}</p>
        </div>
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>My Account</p>
        <SideLink to="/dashboard"         icon={<FiUser size={16} />}       label="Overview"          />
        <SideLink to="/dashboard/orders"  icon={<FiPackage size={16} />}    label="My Orders"         />
        <SideLink to="/dashboard/profile" icon={<FiEdit2 size={16} />}      label="Edit Profile" active />
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mt-4 mb-1"
           style={{ color: 'var(--color-muted)' }}>Shopping</p>
        <SideLink to="/wishlist"  icon={<FiHeart size={16} />}        label="Wishlist" />
        <SideLink to="/cart"      icon={<FiShoppingCart size={16} />} label="Cart"     />
        <SideLink to="/products"  icon={<FiBox size={16} />}          label="Shop"     />
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 max-w-2xl">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Edit Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Keep your information up to date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pb-10">

          {/* Avatar section */}
          <div className="bg-white rounded-2xl p-5 flex items-center gap-5"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl
                            font-bold text-white shrink-0"
                 style={{ backgroundColor: 'var(--color-primary)' }}>
              {userInfo?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                {userInfo?.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {userInfo?.isAdmin ? '👑 Admin' : '👤 Customer'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Member since {new Date(userInfo?.createdAt || Date.now())
                  .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-5"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
              Personal Information
            </h2>
            <div className="space-y-4">
              {fields.personal.map(({ name, label, icon, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>{label}</label>
                  <div className="relative">
                    {icon && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--color-muted)' }}>{icon}</span>
                    )}
                    <input type={type} name={name} value={form[name]}
                      onChange={handleChange} placeholder={placeholder}
                      className={`input text-sm ${icon ? 'pl-10' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Default Address */}
          <div className="bg-white rounded-2xl p-5"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
              Default Shipping Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {fields.address.map(({ name, label, icon, type, placeholder, col }) => (
                <div key={name} className={`col-span-${col}`}>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>{label}</label>
                  <div className="relative">
                    {icon && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--color-muted)' }}>{icon}</span>
                    )}
                    <input type={type} name={name} value={form[name]}
                      onChange={handleChange} placeholder={placeholder}
                      className={`input text-sm ${icon ? 'pl-10' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl p-5"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>
              Change Password
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
              Leave blank to keep your current password
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>New Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="input pl-10 pr-10 text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }}>
                    {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Confirm New Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input
                    type="password"
                    name="confirm" value={form.confirm}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    className="input pl-10 text-sm"
                    style={{
                      borderColor: form.confirm && form.confirm !== form.password
                        ? '#ef4444' : undefined
                    }} />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs mt-1 text-red-500">Passwords don't match</p>
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                       text-white font-medium text-sm transition-all disabled:opacity-60"
            style={{ backgroundColor: saved ? '#22c55e' : 'var(--color-primary)' }}>
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : saved ? (
              <><FiCheck size={16} /> Saved!</>
            ) : (
              <><FiCheck size={16} /> Save Changes</>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}