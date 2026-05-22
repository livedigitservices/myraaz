import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiStar, FiCheck, FiPackage, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Spin = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

const ProductRow = ({ product, isSelected, onSelect }) => (
  <button
    onClick={() => onSelect(product)}
    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
    style={{
      backgroundColor: isSelected ? 'var(--color-soft)' : 'transparent',
      border: isSelected ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
    }}
  >
    <div
      className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-soft)' }}
    >
      {product.images?.[0] ? (
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
      ) : (
        <FiPackage size={18} style={{ color: 'var(--color-muted)' }} />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--color-dark)' }}>
        {product.name}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
          ₹{product.price}
        </span>
        {product.numReviews > 0 && (
          <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--color-muted)' }}>
            <FiStar size={10} fill="currentColor" />
            {product.rating?.toFixed(1)} ({product.numReviews})
          </span>
        )}
        {product.isBestSeller && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            Best Seller
          </span>
        )}
      </div>
    </div>

    {isSelected && (
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
           style={{ backgroundColor: 'var(--color-primary)' }}>
        <FiCheck size={11} color="white" />
      </div>
    )}
  </button>
);

export default function FeaturedProductPicker() {
  const [products,        setProducts]        = useState([]);
  const [query,           setQuery]           = useState('');
  const [currentFeatured, setCurrentFeatured] = useState(null);
  const [isActive,        setIsActive]        = useState(true);
  const [pending,         setPending]         = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCurrent,  setLoadingCurrent]  = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [toggling,        setToggling]        = useState(false);
  const debounceRef = useRef(null);

  const fetchCurrent = async () => {
    setLoadingCurrent(true);
    try {
      const { data } = await api.get('/home-featured/admin');
      setCurrentFeatured(data?.product ?? null);
      setIsActive(data?.isActive ?? true);
    } catch {
      // none set yet
    } finally {
      setLoadingCurrent(false);
    }
  };

  const fetchProducts = async (search = '') => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/products', { params: { search, limit: 50 } });
      setProducts(Array.isArray(data) ? data : data.products ?? []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(val), 350);
  };

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const { data } = await api.put('/home-featured/admin', { productId: pending._id });
      setCurrentFeatured(data);
      setIsActive(true);
      setPending(null);
      toast.success('Featured product updated! 🎉');
    } catch {
      toast.error('Failed to update featured product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!currentFeatured) return;
    setToggling(true);
    try {
      const { data } = await api.patch('/home-featured/admin/toggle');
      setIsActive(data.isActive);
      toast.success(data.isActive ? 'Hero section is now visible' : 'Hero section is now hidden');
    } catch {
      toast.error('Failed to toggle visibility');
    } finally {
      setToggling(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase())
  );

  const effectiveSelected = pending ?? currentFeatured;

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
            Hero Featured Product
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Choose the product shown in the homepage hero section.
          </p>
        </div>
        <button
          onClick={() => { fetchProducts(query); fetchCurrent(); }}
          className="p-1.5 rounded-lg transition-all hover:opacity-70"
          style={{ color: 'var(--color-muted)' }}
          title="Refresh"
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      {/* Currently live */}
      {loadingCurrent ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <Spin /> Loading current…
        </div>
      ) : currentFeatured ? (
        <div className="flex items-center gap-3 p-3 rounded-xl"
             style={{ backgroundColor: 'var(--color-soft)' }}>

          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
               style={{ backgroundColor: 'white' }}>
            {currentFeatured.images?.[0] ? (
              <img src={currentFeatured.images[0]} alt={currentFeatured.name}
                   className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FiPackage size={14} style={{ color: 'var(--color-muted)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--color-dark)' }}>
              {currentFeatured.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {isActive ? 'Visible on homepage' : 'Hidden from homepage'}
            </p>
          </div>

          {/* Visibility badge + toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2',
                    color:           isActive ? '#059669' : '#DC2626',
                  }}>
              {isActive ? 'Visible' : 'Hidden'}
            </span>

            {/* Toggle switch */}
            <div
              onClick={!toggling ? handleToggle : undefined}
              className="w-10 h-5 rounded-full relative transition-colors shrink-0"
              style={{
                backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-soft)',
                cursor: toggling ? 'not-allowed' : 'pointer',
                opacity: toggling ? 0.6 : 1,
              }}
            >
              <div
                className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform shadow"
                style={{ transform: isActive ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
          No featured product set — the static placeholder is shown.
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <FiSearch size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search products…"
          className="input text-sm pl-8"
        />
      </div>

      {/* Product list */}
      <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '280px' }}>
        {loadingProducts ? (
          <div className="flex items-center justify-center py-8"><Spin /></div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'var(--color-muted)' }}>
            No products found
          </p>
        ) : (
          filteredProducts.map(product => (
            <ProductRow
              key={product._id}
              product={product}
              isSelected={effectiveSelected?._id === product._id}
              onSelect={p => setPending(prev => prev?._id === p._id ? null : p)}
            />
          ))
        )}
      </div>

      {/* Save button */}
      {pending && pending._id !== currentFeatured?._id && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     text-white text-sm font-medium transition-all hover:opacity-90
                     disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {saving ? <><Spin /> Saving…</> : <><FiCheck size={14} /> Set as Featured Product</>}
        </button>
      )}
    </div>
  );
}