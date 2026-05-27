import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiX, FiStar, FiShoppingCart,
  FiHeart, FiChevronDown, FiSliders, FiGrid, FiList
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

/* ── Stars ── */
const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <FiStar key={i} size={11}
        fill={i <= Math.round(rating) ? 'var(--color-accent)' : 'none'}
        color={i <= Math.round(rating) ? 'var(--color-accent)' : 'var(--color-muted)'}
      />
    ))}
  </div>
);

/* ── Product Card Grid View ── */
const ProductCardGrid = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
         style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Image */}
      <div className="relative overflow-hidden aspect-square"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`}>
          <img src={product.image} alt={product.name}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>

        {/* Wishlist */}
        <button
          onClick={() => {
            if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
            else            { addToWishlist(product);          toast.success('Added to wishlist 💛'); }
          }}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center
                     justify-center shadow-md transition-transform duration-200 hover:scale-110">
          <FiHeart size={13}
            fill={wishlisted ? '#D4AF8C' : 'none'}
            color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
        </button>

        {/* Category badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
             style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          {product.category}
        </div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-500">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 sm:p-4">
        <p className="text-xs mb-0.5 truncate" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
        <Link to={`/products/${product._id}`}>
          <h3 className="text-xs sm:text-sm font-semibold mb-2 line-clamp-2 leading-snug hover:underline"
              style={{ color: 'var(--color-dark)', minHeight: '2.5rem' }}>
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mb-2">
          <Stars rating={product.rating} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
        </div>

        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="text-base sm:text-lg font-semibold"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <button
            disabled={product.stock === 0}
            onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full
                       text-xs font-medium text-white transition-all duration-200
                       hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={12} />
            <span className="hidden xs:inline sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Product Card List View ── */
const ProductCardList = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex transition-all duration-200"
         style={{ boxShadow: 'var(--shadow-card)' }}>

      <div className="relative w-24 sm:w-36 shrink-0 overflow-hidden"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`} className="block h-full">
          <img src={product.image} alt={product.name}
               className="w-full h-full object-cover" />
        </Link>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-500">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs mb-0.5 truncate" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
              <Link to={`/products/${product._id}`}>
                <h3 className="text-sm font-semibold leading-snug hover:underline mb-1 line-clamp-2"
                    style={{ color: 'var(--color-dark)' }}>{product.name}</h3>
              </Link>
            </div>
            <span className="hidden sm:inline px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0"
                  style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
              {product.category}
            </span>
          </div>
          <p className="hidden sm:block text-xs leading-relaxed mt-2 line-clamp-2"
             style={{ color: 'var(--color-muted)' }}>{product.description}</p>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Stars rating={product.rating} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
            </div>
            <span className="text-base sm:text-xl font-semibold"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => {
              if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed'); }
              else            { addToWishlist(product); toast.success('Added to wishlist 💛'); }
            }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all"
              style={{ borderColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
              <FiHeart size={13}
                fill={wishlisted ? '#D4AF8C' : 'none'}
                color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
            </button>
            <button
              disabled={product.stock === 0}
              onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-full text-xs font-medium
                         text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <FiShoppingCart size={13} />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sidebar ── */
const Sidebar = ({
  filters, categories, priceInput, setPriceInput,
  updateFilter, applyPrice, clearFilters,
  activeFilterCount, setSidebarOpen,
}) => (
  <div className="space-y-7">

    {/* Category */}
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-muted)' }}>Category</h4>
      <div className="space-y-1.5">
        {categories.map(({ label, value }) => (
          <button key={value}
            onClick={() => { updateFilter('category', value); setSidebarOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-150"
            style={{
              backgroundColor: filters.category === value ? 'var(--color-primary)' : 'transparent',
              color: filters.category === value ? 'white' : 'var(--color-dark)',
            }}>
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* Price */}
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-muted)' }}>Price Range (₹)</h4>
      <div className="flex items-center gap-2">
        <input type="number" placeholder="Min"
          value={priceInput.min}
          onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
          onBlur={applyPrice}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          className="input text-center text-sm" />
        <span style={{ color: 'var(--color-muted)' }}>—</span>
        <input type="number" placeholder="Max"
          value={priceInput.max}
          onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
          onBlur={applyPrice}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          className="input text-center text-sm" />
      </div>
      {(priceInput.min || priceInput.max) && (
        <button onClick={applyPrice}
          className="w-full mt-2 py-2 rounded-xl text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          Apply Price Filter
        </button>
      )}
    </div>

    {/* Rating — FIX: toggle deselect + number type comparison */}
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-muted)' }}>Min Rating</h4>
      <div className="space-y-1.5">
        {[4, 3, 2].map(r => (
          <button key={r}
            onClick={() => updateFilter('minRating', filters.minRating === r ? '' : r)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              backgroundColor: filters.minRating === r ? 'var(--color-soft)' : 'transparent',
              color: 'var(--color-dark)',
              outline: filters.minRating === r ? '1.5px solid var(--color-primary)' : 'none',
            }}>
            <Stars rating={r} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>& above</span>
          </button>
        ))}
      </div>
    </div>

    {activeFilterCount > 0 && (
      <button onClick={clearFilters}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
        Clear all filters
      </button>
    )}
  </div>
);

/* ── Home Media Background ── */
const HomeMediaBackground = ({ media }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const total = media.length;

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex(i => (i + 1) % total);
    }, 5000);
    return () => clearTimeout(timerRef.current);
  }, [index, total]);

  if (!total) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        width: `${total * 100}%`,
        height: '100%',
        transform: `translateX(-${(index * 100) / total}%)`,
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}>
        {media.map(item => (
          <div key={item._id} style={{ width: `${100 / total}%`, height: '100%', flexShrink: 0 }}>
            {item.type === 'video' ? (
              <video src={item.url} autoPlay muted playsInline loop
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <img src={item.url} alt="" aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Products Page ── */
export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode]       = useState('grid');

  // FIX: coerce minRating to number so === comparisons work correctly
  const [filters, setFilters] = useState({
    search:    searchParams.get('search')    || '',
    category:  searchParams.get('category') || '',
    minPrice:  searchParams.get('minPrice') || '',
    maxPrice:  searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : '',
    sort:      searchParams.get('sort')     || 'newest',
    page:      Number(searchParams.get('page')) || 1,
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const [priceInput, setPriceInput]   = useState({ min: filters.minPrice, max: filters.maxPrice });

  const categories = [
    { label: 'All',          value: ''            },
    { label: 'Hair Oils',    value: 'hair-oil'    },
    { label: 'Shampoos',     value: 'shampoo'     },
    { label: 'Conditioners', value: 'conditioner' },
    { label: 'Hair Masks',   value: 'hair-mask'   },
    { label: 'Serums',       value: 'serum'       },
  ];

  const [homeMedia, setHomeMedia] = useState([]);

  useEffect(() => {
    api.get('/home-media')
      .then(({ data }) => setHomeMedia(Array.isArray(data) ? data : []))
      .catch(() => setHomeMedia([]));
  }, []);

  const sortOptions = [
    { label: 'Newest First',      value: 'newest'      },
    { label: 'Price: Low → High', value: 'price_asc'   },
    { label: 'Price: High → Low', value: 'price_desc'  },
    { label: 'Top Rated',         value: 'rating_desc' },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)    params.set('search',    filters.search);
      if (filters.category)  params.set('category',  filters.category);
      if (filters.minPrice)  params.set('minPrice',  filters.minPrice);
      if (filters.maxPrice)  params.set('maxPrice',  filters.maxPrice);
      if (filters.minRating) params.set('minRating', filters.minRating);
      params.set('sort',  filters.sort);
      params.set('page',  filters.page);
      params.set('limit', 12);

      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setSearchParams(params);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) =>
    setFilters(f => ({ ...f, [key]: value, page: 1 }));

  const applyPrice = useCallback(() => {
    setFilters(f => ({ ...f, minPrice: priceInput.min, maxPrice: priceInput.max, page: 1 }));
  }, [priceInput]);

  const handleSearch = (e) => { e.preventDefault(); updateFilter('search', searchInput); };

  const clearFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', minRating: '', sort: 'newest', page: 1 });
    setSearchInput('');
    setPriceInput({ min: '', max: '' });
  };

  const activeFilterCount = [
    filters.category, filters.minPrice, filters.maxPrice, filters.minRating,
  ].filter(Boolean).length;

  const sidebarProps = {
    filters, categories, priceInput, setPriceInput,
    updateFilter, applyPrice, clearFilters,
    activeFilterCount, setSidebarOpen,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Page Header with sliding banner background */}
      <div className="relative overflow-hidden" style={{ minHeight: 'clamp(160px, 30vw, 320px)' }}>
        {homeMedia.length > 0 && <HomeMediaBackground media={homeMedia} />}
        {homeMedia.length === 0 && (
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-primary)' }} />
        )}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(26,46,26,0.90) 0%, rgba(26,46,26,0.55) 60%, rgba(26,46,26,0.25) 100%)',
          zIndex: 1,
        }} />
        <div className="relative h-full flex flex-col justify-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
             style={{ zIndex: 2, paddingTop: 'clamp(24px, 5vw, 56px)', paddingBottom: 'clamp(24px, 5vw, 56px)' }}>
          <p className="text-white/60 uppercase tracking-widest mb-1 sm:mb-2"
             style={{ fontSize: 'clamp(9px, 1.5vw, 12px)' }}>
            Our Collection
          </p>
          <h1 className="font-semibold text-white leading-tight mb-1 sm:mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 4vw, 42px)' }}>
            All Products
          </h1>
          <p className="text-white/70" style={{ fontSize: 'clamp(11px, 1.8vw, 14px)' }}>
            {total > 0 ? `${total} products found` : 'Explore our full range of hair care'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

        {/* Search + Controls */}
        <div className="flex flex-col gap-3 mb-6">

          {/* Row 1: Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search hair oils, shampoos, brands..."
              className="input pl-10 pr-24 w-full"
            />
            {searchInput && (
              <button type="button"
                onClick={() => { setSearchInput(''); updateFilter('search', ''); }}
                className="absolute right-14 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-muted)' }}>
                <FiX size={14} />
              </button>
            )}
            <button type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg
                         text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Search
            </button>
          </form>

          {/* Row 2: Sort + Filter + View toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={filters.sort}
                onChange={e => updateFilter('sort', e.target.value)}
                className="input pr-8 appearance-none cursor-pointer text-sm w-full"
                style={{ color: 'var(--color-dark)' }}>
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FiChevronDown size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-muted)' }} />
            </div>

            <button onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                         transition-all lg:hidden relative shrink-0"
              style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
              <FiSliders size={15} />
              <span className="hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white
                                 text-xs flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1 p-1 rounded-xl shrink-0"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              {[['grid', <FiGrid size={15} />], ['list', <FiList size={15} />]].map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: viewMode === mode ? 'white' : 'transparent',
                    color: viewMode === mode ? 'var(--color-primary)' : 'var(--color-muted)',
                    boxShadow: viewMode === mode ? 'var(--shadow-card)' : 'none',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(filters.category || filters.minPrice || filters.maxPrice || filters.search) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.search && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                   style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                🔍 "{filters.search}"
                <button onClick={() => { updateFilter('search', ''); setSearchInput(''); }}>
                  <FiX size={11} />
                </button>
              </div>
            )}
            {filters.category && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                   style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                {categories.find(c => c.value === filters.category)?.label}
                <button onClick={() => updateFilter('category', '')}><FiX size={11} /></button>
              </div>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                   style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                ₹{filters.minPrice || '0'} — ₹{filters.maxPrice || '∞'}
                <button onClick={() => {
                  setFilters(f => ({ ...f, minPrice: '', maxPrice: '', page: 1 }));
                  setPriceInput({ min: '', max: '' });
                }}>
                  <FiX size={11} />
                </button>
              </div>
            )}
            <button onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ color: 'var(--color-primary)' }}>
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-7">

          {/* Desktop Sidebar */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl p-5 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <Sidebar {...sidebarProps} />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {loading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse"
                         style={{ boxShadow: 'var(--shadow-card)' }}>
                      <div className="aspect-square" style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="p-3 sm:p-4 space-y-2">
                        <div className="h-2.5 rounded-full w-1/3" style={{ backgroundColor: 'var(--color-soft)' }} />
                        <div className="h-2.5 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-soft)' }} />
                        <div className="h-2.5 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-soft)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden flex animate-pulse"
                         style={{ boxShadow: 'var(--shadow-card)', height: '120px' }}>
                      <div className="w-24 sm:w-36 shrink-0" style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="flex-1 p-4 space-y-2 flex flex-col justify-center">
                        <div className="h-2.5 rounded-full w-1/4" style={{ backgroundColor: 'var(--color-soft)' }} />
                        <div className="h-2.5 rounded-full w-2/3" style={{ backgroundColor: 'var(--color-soft)' }} />
                        <div className="h-2.5 rounded-full w-1/3" style={{ backgroundColor: 'var(--color-soft)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : products.length === 0 ? (

              /* ── FIX: modern icon empty state ── */
              <div className="text-center py-24 bg-white rounded-2xl"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <FiSearch size={28} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-dark)' }}>
                  No products found
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                  Try adjusting your search or filters
                </p>
                <button onClick={clearFilters} className="btn-primary">Clear filters</button>
              </div>

            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5'
                  : 'flex flex-col gap-3 sm:gap-4'}>
                  {products.map(product => (
                    viewMode === 'grid'
                      ? <ProductCardGrid key={product._id} product={product} />
                      : <ProductCardList key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-10 flex-wrap">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                      ← Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i}
                        onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-sm font-medium transition-all"
                        style={{
                          backgroundColor: filters.page === i + 1 ? 'var(--color-primary)' : 'var(--color-soft)',
                          color: filters.page === i + 1 ? 'white' : 'var(--color-dark)',
                        }}>
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={filters.page === totalPages}
                      onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden"
               onClick={() => setSidebarOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6
                          max-h-[80vh] overflow-y-auto lg:hidden"
               style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-base flex items-center gap-2"
                  style={{ color: 'var(--color-dark)' }}>
                <FiFilter size={16} /> Filters
              </h3>
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--color-muted)' }}>
                <FiX size={20} />
              </button>
            </div>
            <Sidebar {...sidebarProps} />
            <button onClick={() => setSidebarOpen(false)}
              className="w-full mt-6 py-3 rounded-full text-white font-medium text-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Show Results ({total})
            </button>
          </div>
        </>
      )}
    </div>
  );
}