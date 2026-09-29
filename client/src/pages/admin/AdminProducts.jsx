import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiBox, FiAlertCircle, FiTrendingUp, FiUsers,
  FiShoppingCart, FiEye, FiHome, FiTag,
  FiPackage
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

/* ── Sidebar link — hairline indicator, matches Dashboard/Users ── */
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

export default function AdminProducts() {
  const { pathname }                = useLocation();
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deleting, setDeleting]     = useState(null);
  const [filterCat, setFilterCat]   = useState('');

  const categories = ['', 'hair-oil', 'shampoo', 'conditioner', 'hair-mask', 'serum'];

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search)    params.set('search',   search);
      if (filterCat) params.set('category', filterCat);
      params.set('limit', 50);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [search, filterCat]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      setDeleting(id);
      await api.delete(`/products/admin/${id}`);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const inStock    = products.filter(p => p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Eyebrow>Catalogue</Eyebrow>
            <h1 className="text-2xl font-semibold mt-2"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Products
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {products.length} total · {inStock} in stock · {outOfStock} out of stock
            </p>
          </div>
          <Link
            to="/admin/products/add"
            className="flex items-center justify-center gap-2 px-6 py-3
                       text-white text-xs font-medium uppercase tracking-wider transition-all hover:opacity-90 w-fit"
            style={{ backgroundColor: 'var(--color-dark)' }}
          >
            <FiPlus size={15} /> Add Product
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch size={15} className="absolute left-1 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input
              type="text" placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent focus:outline-none"
              style={{ borderBottom: '1.5px solid var(--color-soft)', color: 'var(--color-dark)' }}
              onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--color-accent)'}
              onBlur={e => e.currentTarget.style.borderBottomColor = 'var(--color-soft)'}
            />
          </div>
          <select
            value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-sm sm:w-44 py-2.5 bg-transparent focus:outline-none"
            style={{ color: 'var(--color-dark)', borderBottom: '1.5px solid var(--color-soft)' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c ? c : 'All Categories'}</option>
            ))}
          </select>
        </div>

        {/* Table / Cards */}
        <div className="bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse items-center">
                  <div className="w-14 h-14 shrink-0"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-24 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                   style={{ border: '1px solid var(--color-accent)' }}>
                <FiAlertCircle size={26} style={{ color: 'var(--color-accent)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                No products found
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                {search ? 'Try a different search term' : 'Add your first product to get started'}
              </p>
              <Link to="/admin/products/add" className="btn-primary">Add Product</Link>
            </div>
          ) : (
            <>
              {/* ── Desktop table (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                      {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                        <th key={h}
                            className="text-left px-5 py-3.5 text-[10px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: 'var(--color-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product._id}
                          className="transition-colors hover:bg-soft/30"
                          style={{ borderBottom: '1px solid var(--color-soft)' }}>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 overflow-hidden shrink-0"
                                 style={{ backgroundColor: 'var(--color-soft)' }}>
                              <img src={product.image} alt={product.name}
                                   className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm line-clamp-1"
                                 style={{ color: 'var(--color-dark)' }}>{product.name}</p>
                              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>
                            {product.category}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-sm"
                                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                            ₹{product.price}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                            <span className="text-sm" style={{ color: 'var(--color-dark)' }}>
                              {product.stock}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-sm" style={{ color: 'var(--color-dark)' }}>
                            ⭐ {product.rating?.toFixed(1)} ({product.numReviews})
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link to={`/products/${product._id}`}
                                  className="p-2 transition-all hover:bg-soft"
                                  style={{ color: 'var(--color-muted)' }} title="View">
                              <FiEye size={15} />
                            </Link>
                            <Link to={`/admin/products/edit/${product._id}`}
                                  className="p-2 transition-all hover:bg-blue-50"
                                  style={{ color: '#3B82F6' }} title="Edit">
                              <FiEdit2 size={15} />
                            </Link>
                            <button
                              onClick={() => handleDelete(product._id, product.name)}
                              disabled={deleting === product._id}
                              className="p-2 transition-all hover:bg-red-50 disabled:opacity-40"
                              style={{ color: '#EF4444' }} title="Delete">
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (< md) ── */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-soft)' }}>
                {products.map(product => (
                  <div key={product._id} className="p-4 flex items-start gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <img src={product.image} alt={product.name}
                           className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1"
                         style={{ color: 'var(--color-dark)' }}>{product.name}</p>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
                        {product.brand}
                      </p>

                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>
                          {product.category}
                        </span>
                        <span className="font-semibold text-sm"
                              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                          ₹{product.price}
                        </span>
                        <span className="flex items-center gap-1 text-xs"
                              style={{ color: 'var(--color-dark)' }}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                          {product.stock} in stock
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          ⭐ {product.rating?.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Link to={`/products/${product._id}`}
                            className="p-2 transition-all hover:bg-soft"
                            style={{ color: 'var(--color-muted)' }}>
                        <FiEye size={15} />
                      </Link>
                      <Link to={`/admin/products/edit/${product._id}`}
                            className="p-2 transition-all hover:bg-blue-50"
                            style={{ color: '#3B82F6' }}>
                        <FiEdit2 size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        disabled={deleting === product._id}
                        className="p-2 transition-all hover:bg-red-50 disabled:opacity-40"
                        style={{ color: '#EF4444' }}>
                        <FiTrash2 size={15} />
                      </button>
                    </div>
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