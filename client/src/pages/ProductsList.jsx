import { useState, useEffect, useCallback } from 'react';
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
    {[1,2,3,4,5].map(i => (
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
      <div className="relative overflow-hidden aspect-square"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`}>
          <img src={product.image} alt={product.name}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <button onClick={() => {
          if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
          else            { addToWishlist(product);           toast.success('Added to wishlist 💛'); }
        }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center
                     justify-center shadow-md transition-transform duration-200 hover:scale-110">
          <FiHeart size={14}
            fill={wishlisted ? '#D4AF8C' : 'none'}
            color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
        </button>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize"
             style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          {product.category}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-500">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
        <Link to={`/products/${product._id}`}>
          <h3 className="text-sm font-semibold mb-2 line-clamp-2 leading-snug hover:underline"
              style={{ color: 'var(--color-dark)' }}>{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.rating} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
            ₹{product.price}
          </span>
          <button
            disabled={product.stock === 0}
            onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                       text-white transition-all duration-200 hover:opacity-90 active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={12} /> Add
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
      <div className="relative w-36 shrink-0 overflow-hidden"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`}>
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
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
              <Link to={`/products/${product._id}`}>
                <h3 className="text-sm font-semibold leading-snug hover:underline mb-1"
                    style={{ color: 'var(--color-dark)' }}>{product.name}</h3>
              </Link>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0"
                  style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
              {product.category}
            </span>
          </div>
          <p className="text-xs leading-relaxed mt-2 line-clamp-2"
             style={{ color: 'var(--color-muted)' }}>{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stars rating={product.rating} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
            </div>
            <span className="text-xl font-semibold"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
              ₹{product.price}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed'); }
              else            { addToWishlist(product); toast.success('Added to wishlist 💛'); }
            }}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-all"
              style={{ borderColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
              <FiHeart size={14}
                fill={wishlisted ? '#D4AF8C' : 'none'}
                color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
            </button>
            <button
              disabled={product.stock === 0}
              onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium
                         text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <FiShoppingCart size={13} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   SIDEBAR — defined OUTSIDE main component
   so it never remounts on state change
══════════════════════════════════════════ */
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
              backgroundColor: filters.category === value
                ? 'var(--color-primary)' : 'transparent',
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
        <input
          type="number"
          placeholder="Min"
          value={priceInput.min}
          onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
          onBlur={() => applyPrice()}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          className="input text-center text-sm"
        />
        <span style={{ color: 'var(--color-muted)' }}>—</span>
        <input
          type="number"
          placeholder="Max"
          value={priceInput.max}
          onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
          onBlur={() => applyPrice()}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          className="input text-center text-sm"
        />
      </div>
      {(priceInput.min || priceInput.max) && (
        <button
          onClick={applyPrice}
          className="w-full mt-2 py-2 rounded-xl text-xs font-medium text-white transition-all"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          Apply Price Filter
        </button>
      )}
    </div>

    {/* Rating */}
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-muted)' }}>Min Rating</h4>
      <div className="space-y-1.5">
        {[4, 3, 2].map(r => (
          <button key={r}
            onClick={() => updateFilter('minRating', r)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ color: 'var(--color-dark)' }}>
            <Stars rating={r} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>& above</span>
          </button>
        ))}
      </div>
    </div>

    {/* Clear */}
    {activeFilterCount > 0 && (
      <button onClick={clearFilters}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
        Clear all filters
      </button>
    )}
  </div>
);

/* ══════════════════════════════════════════
   MAIN PRODUCTS PAGE
══════════════════════════════════════════ */
export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode]       = useState('grid');

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort:     searchParams.get('sort')     || 'newest',
    page:     Number(searchParams.get('page')) || 1,
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  /* Separate local state for price inputs — never triggers API on keystroke */
  const [priceInput, setPriceInput] = useState({
    min: filters.minPrice,
    max: filters.maxPrice,
  });

  const categories = [
    { label: 'All',          value: ''            },
    { label: 'Hair Oils',    value: 'hair-oil'    },
    { label: 'Shampoos',     value: 'shampoo'     },
    { label: 'Conditioners', value: 'conditioner' },
    { label: 'Hair Masks',   value: 'hair-mask'   },
    { label: 'Serums',       value: 'serum'       },
  ];

  const sortOptions = [
    { label: 'Newest First',      value: 'newest'      },
    { label: 'Price: Low → High', value: 'price_asc'   },
    { label: 'Price: High → Low', value: 'price_desc'  },
    { label: 'Top Rated',         value: 'rating_desc' },
  ];

  /* Fetch products */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)   params.set('search',   filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
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

  /* Apply price — called on blur / Enter / button click */
  const applyPrice = useCallback(() => {
    setFilters(f => ({
      ...f,
      minPrice: priceInput.min,
      maxPrice: priceInput.max,
      page: 1,
    }));
  }, [priceInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 });
    setSearchInput('');
    setPriceInput({ min: '', max: '' });
  };

  const activeFilterCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  /* Shared sidebar props */
  const sidebarProps = {
    filters, categories, priceInput, setPriceInput,
    updateFilter, applyPrice, clearFilters,
    activeFilterCount, setSidebarOpen,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ backgroundColor: 'var(--color-primary)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Our Collection</p>
          <h1 className="text-4xl font-semibold text-white mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}>All Products</h1>
          <p className="text-white/70 text-sm">
            {total > 0 ? `${total} products found` : 'Explore our full range of hair care'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── SEARCH + SORT BAR ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search hair oils, shampoos, brands..."
              className="input pl-10 pr-24"
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

          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={e => updateFilter('sort', e.target.value)}
              className="input pr-8 appearance-none cursor-pointer text-sm min-w-44"
              style={{ color: 'var(--color-dark)' }}>
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FiChevronDown size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted)' }} />
          </div>

          {/* Filter button mobile */}
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                       transition-all lg:hidden relative"
            style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
            <FiSliders size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white
                               text-xs flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Grid / List toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl"
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

        {/* ── ACTIVE FILTER CHIPS ── */}
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
                  updateFilter('minPrice', '');
                  updateFilter('maxPrice', '');
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

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl p-5 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold"
                    style={{ color: 'var(--color-dark)' }}>Filters</h3>
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

          {/* ── PRODUCTS GRID / LIST ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 gap-5'
                : 'flex flex-col gap-4'}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse"
                       style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className={viewMode === 'grid' ? 'aspect-square' : 'h-32 w-36'}
                         style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="p-4 space-y-2">
                      <div className="h-3 rounded-full w-1/3"
                           style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="h-3 rounded-full w-3/4"
                           style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="h-3 rounded-full w-1/2"
                           style={{ backgroundColor: 'var(--color-soft)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--color-dark)' }}>No products found</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                  Try adjusting your search or filters
                </p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-5'
                  : 'flex flex-col gap-4'}>
                  {products.map(product => (
                    viewMode === 'grid'
                      ? <ProductCardGrid key={product._id} product={product} />
                      : <ProductCardList key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all
                                 disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                      ← Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i}
                        onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                        className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                        style={{
                          backgroundColor: filters.page === i + 1
                            ? 'var(--color-primary)' : 'var(--color-soft)',
                          color: filters.page === i + 1 ? 'white' : 'var(--color-dark)',
                        }}>
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={filters.page === totalPages}
                      onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all
                                 disabled:opacity-40"
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

      {/* ── MOBILE FILTER DRAWER ── */}
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
              <button onClick={() => setSidebarOpen(false)}
                      style={{ color: 'var(--color-muted)' }}>
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