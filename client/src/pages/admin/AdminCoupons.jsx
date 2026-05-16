import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTag, FiPlus, FiEdit2, FiTrash2, FiX,
  FiCheck, FiTrendingUp, FiBox, FiShoppingCart,
  FiUsers, FiEye, FiToggleLeft, FiToggleRight,
  FiPackage,
  FiHome
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

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

const emptyForm = {
  code: '', description: '', type: 'percent',
  value: '', minOrder: '', maxUses: '',
  isActive: true, showOnBanner: false, expiresAt: '',
};

export default function AdminCoupons() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(emptyForm);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/admin');
      setCoupons(data);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setForm({
      code:         coupon.code,
      description:  coupon.description || '',
      type:         coupon.type,
      value:        coupon.value,
      minOrder:     coupon.minOrder || '',
      maxUses:      coupon.maxUses  || '',
      isActive:     coupon.isActive,
      showOnBanner: coupon.showOnBanner,
      expiresAt:    coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split('T')[0]
        : '',
    });
    setEditing(coupon._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value)
      return toast.error('Code and discount value are required');

    try {
      setSaving(true);
      const payload = {
        ...form,
        value:    Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses:  Number(form.maxUses)  || 0,
        expiresAt: form.expiresAt || null,
      };

      if (editing) {
        const { data } = await api.put(`/coupons/admin/${editing}`, payload);
        setCoupons(prev => prev.map(c => c._id === editing ? data : c));
        toast.success('Coupon updated ✅');
      } else {
        const { data } = await api.post('/coupons/admin', payload);
        setCoupons(prev => [data, ...prev]);
        toast.success('Coupon created 🎉');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success('Coupon deleted');
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggle = async (coupon) => {
    try {
      const { data } = await api.put(`/coupons/admin/${coupon._id}`, {
        ...coupon,
        isActive: !coupon.isActive,
      });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? data : c));
      toast.success(`Coupon ${data.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}   label="Dashboard"       />
        <SideLink to="/admin/products" icon={<FiBox size={16} />}          label="Products"        />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />} label="Orders"          />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}        label="Users"           />
        <SideLink to="/admin/coupons"  icon={<FiTag size={16} />}          label="Coupons" active  />
        <SideLink to="/admin/returns" icon={<FiPackage size={16} />} label="Returns" />
        <SideLink to="/admin/home-media" icon={<FiHome size={16} />} label="Home Media" />
        
        <div className="mt-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Coupons
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {coupons.length} total · {coupons.filter(c => c.isActive).length} active
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white
                       text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiPlus size={15} /> Add Coupon
          </button>
        </div>

        {/* Coupons grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-6 w-24 rounded-full mb-3"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="h-4 w-full rounded-full mb-2"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="h-4 w-2/3 rounded-full"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <FiTag size={36} style={{ color: 'var(--color-muted)' }} className="mx-auto mb-3" />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
              No coupons yet
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
              Create your first coupon to offer discounts
            </p>
            <button onClick={openCreate} className="btn-primary">
              Add Coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <div key={coupon._id}
                   className="bg-white rounded-2xl p-5 transition-all duration-200"
                   style={{
                     boxShadow: 'var(--shadow-card)',
                     opacity: !coupon.isActive || isExpired(coupon.expiresAt) ? 0.6 : 1,
                   }}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base px-3 py-1 rounded-xl"
                            style={{ backgroundColor: 'var(--color-soft)',
                                     color: 'var(--color-primary)' }}>
                        {coupon.code}
                      </span>
                      {coupon.showOnBanner && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: 'var(--color-accent)' }}>
                          Banner
                        </span>
                      )}
                      {isExpired(coupon.expiresAt) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
                      {coupon.description || 'No description'}
                    </p>
                  </div>

                  {/* Toggle active */}
                  <button onClick={() => handleToggle(coupon)}
                    className="shrink-0 transition-colors"
                    style={{ color: coupon.isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                    title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                    {coupon.isActive
                      ? <FiToggleRight size={24} />
                      : <FiToggleLeft size={24} />}
                  </button>
                </div>

                {/* Discount value */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-semibold"
                        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                    {coupon.type === 'percent'
                      ? `${coupon.value}% off`
                      : `₹${coupon.value} off`}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-4">
                  {coupon.minOrder > 0 && (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Min. order: ₹{coupon.minOrder}
                    </p>
                  )}
                  {coupon.maxUses > 0 && (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Uses: {coupon.usedCount}/{coupon.maxUses}
                    </p>
                  )}
                  {coupon.expiresAt && (
                    <p className="text-xs"
                       style={{ color: isExpired(coupon.expiresAt) ? '#ef4444' : 'var(--color-muted)' }}>
                      Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3"
                     style={{ borderTop: '1px solid var(--color-soft)' }}>
                  <button onClick={() => openEdit(coupon)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                               font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                    <FiEdit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(coupon._id, coupon.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                               font-medium transition-all hover:bg-red-50"
                    style={{ color: '#ef4444' }}>
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── CREATE / EDIT MODAL ── */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
               onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                 style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 sticky top-0
                              bg-white rounded-t-3xl z-10"
                   style={{ borderBottom: '1px solid var(--color-soft)' }}>
                <h2 className="text-base font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                  {editing ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             hover:bg-soft transition-all"
                  style={{ color: 'var(--color-muted)' }}>
                  <FiX size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">

                {/* Code */}
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>
                    Coupon Code *
                  </label>
                  <input type="text" name="code" value={form.code}
                    onChange={handleChange} placeholder="e.g. SAVE20"
                    className="input text-sm uppercase tracking-widest"
                    style={{ letterSpacing: '0.1em' }} />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>
                    Description (shown on banner)
                  </label>
                  <input type="text" name="description" value={form.description}
                    onChange={handleChange} placeholder="e.g. your first order"
                    className="input text-sm" />
                </div>

               {/* Type + Value */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-xs font-medium mb-1.5"
           style={{ color: 'var(--color-dark)' }}>
      Discount Type *
    </label>
    <select name="type" value={form.type} onChange={handleChange}
      className="input text-sm" style={{ color: 'var(--color-dark)' }}>
      <option value="percent">Percentage (%)</option>
      <option value="flat">Flat amount (₹)</option>
    </select>
  </div>
  <div>
    <label className="block text-xs font-medium mb-1.5"
           style={{ color: 'var(--color-dark)' }}>
      {form.type === 'percent' ? 'Percentage (%)' : 'Amount (₹)'} *
    </label>
    <input
      type="text"
      inputMode="numeric"
      name="value"
      value={form.value}
      onChange={e => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setForm(f => ({ ...f, value: val }));
      }}
      placeholder={form.type === 'percent' ? '20' : '100'}
      className="input text-sm"
    />
  </div>
</div>

                {/* Min order + Max uses */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5"
                           style={{ color: 'var(--color-dark)' }}>
                      Min. Order (₹)
                    </label>
                    <input type="number" name="minOrder" value={form.minOrder}
                      onChange={handleChange} placeholder="0 = no minimum"
                      className="input text-sm" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5"
                           style={{ color: 'var(--color-dark)' }}>
                      Max Uses
                    </label>
                    <input type="number" name="maxUses" value={form.maxUses}
                      onChange={handleChange} placeholder="0 = unlimited"
                      className="input text-sm" min="0" />
                  </div>
                </div>

                {/* Expires at */}
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>
                    Expiry Date (optional)
                  </label>
                  <input type="date" name="expiresAt" value={form.expiresAt}
                    onChange={handleChange} className="input text-sm"
                    min={new Date().toISOString().split('T')[0]} />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  {[
                    { name: 'isActive',     label: 'Active',            sub: 'Coupon can be used by customers'    },
                    { name: 'showOnBanner', label: 'Show on Home Banner', sub: 'Display this coupon on homepage'  },
                  ].map(({ name, label, sub }) => (
                    <label key={name}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
                      style={{ backgroundColor: 'var(--color-soft)' }}>
                      <div>
                        <p className="text-sm font-medium"
                           style={{ color: 'var(--color-dark)' }}>{label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                      </div>
                      <div className="relative">
                        <input type="checkbox" name={name}
                          checked={form[name]} onChange={handleChange}
                          className="sr-only" />
                        <div className="w-10 h-6 rounded-full transition-colors"
                             style={{ backgroundColor: form[name]
                               ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                          <div className="w-4 h-4 bg-white rounded-full shadow-md
                                          absolute top-1 transition-transform"
                               style={{ transform: form[name]
                                 ? 'translateX(20px)' : 'translateX(4px)' }} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Preview */}
                {form.code && form.value && (
                  <div className="rounded-2xl p-4"
                       style={{ backgroundColor: 'var(--color-dark)' }}>
                    <p className="text-xs text-white/60 uppercase tracking-widest mb-1">
                      Banner preview
                    </p>
                    <p className="text-white font-semibold">
                      {form.type === 'percent'
                        ? `Get ${form.value}% off`
                        : `Get ₹${form.value} off`}{' '}
                      {form.description || 'your order'}
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      Code:{' '}
                      <span className="font-mono font-bold text-white bg-white/10
                                       px-1.5 py-0.5 rounded">
                        {form.code.toUpperCase()}
                      </span>
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3
                               rounded-full text-white font-medium text-sm
                               transition-all disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10"
                                  stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <><FiCheck size={15} /> {editing ? 'Save Changes' : 'Create Coupon'}</>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{ border: '1.5px solid var(--color-soft)',
                             color: 'var(--color-muted)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}