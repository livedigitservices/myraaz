import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiBox, FiAlertCircle, FiTrendingUp, FiUsers,
  FiShoppingCart, FiEye
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
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

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState(null);
  const [filterCat, setFilterCat] = useState('');

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
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>Overview</p>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}    label="Dashboard"         />
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mt-4 mb-1"
           style={{ color: 'var(--color-muted)' }}>Manage</p>
        <SideLink to="/admin/products" icon={<FiBox size={16} />}           label="Products"  active  />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />}  label="Orders"            />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}         label="Users"             />
        <SideLink to="/admin/coupons" icon={<FiTag size={16} />} label="Coupons" />
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
              Products
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {products.length} total · {inStock} in stock · {outOfStock} out of stock
            </p>
          </div>
          <Link to="/admin/products/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white
                       text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiPlus size={15} /> Add Product
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input type="text" placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10 text-sm" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="input text-sm w-44"
            style={{ color: 'var(--color-dark)' }}>
            {categories.map(c => (
              <option key={c} value={c}>{c ? c : 'All Categories'}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse items-center">
                  <div className="w-14 h-14 rounded-xl shrink-0"
                       style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="h-3 w-24 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FiAlertCircle size={36} style={{ color: 'var(--color-muted)' }} className="mb-3" />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                No products found
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                {search ? 'Try a different search term' : 'Add your first product to get started'}
              </p>
              <Link to="/admin/products/add" className="btn-primary">Add Product</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-soft)' }}>
                    {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                             uppercase tracking-widest"
                          style={{ color: 'var(--color-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}
                        className="transition-colors hover:bg-soft/30"
                        style={{ borderBottom: '1px solid var(--color-soft)' }}>

                      {/* Product */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
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

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs capitalize"
                              style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-sm"
                              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                          ₹{product.price}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                          <span className="text-sm" style={{ color: 'var(--color-dark)' }}>
                            {product.stock}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: 'var(--color-dark)' }}>
                          ⭐ {product.rating?.toFixed(1)} ({product.numReviews})
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link to={`/products/${product._id}`}
                            className="p-2 rounded-xl transition-all hover:bg-soft"
                            style={{ color: 'var(--color-muted)' }}
                            title="View">
                            <FiEye size={15} />
                          </Link>
                          <Link to={`/admin/products/edit/${product._id}`}
                            className="p-2 rounded-xl transition-all hover:bg-blue-50"
                            style={{ color: '#3B82F6' }}
                            title="Edit">
                            <FiEdit2 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            disabled={deleting === product._id}
                            className="p-2 rounded-xl transition-all hover:bg-red-50
                                       disabled:opacity-40"
                            style={{ color: '#EF4444' }}
                            title="Delete">
                            <FiTrash2 size={15} />
                          </button>
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