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

/* ── Eyebrow — the small flanked-line label used across the site ── */
const Eyebrow = ({ children, light = false }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
    <p className="text-[11px] font-medium uppercase tracking-[0.2em]"
       style={{ color: light ? 'var(--color-accent)' : 'var(--color-accent)' }}>
      {children}
    </p>
  </div>
);

/* ── Product Card Grid View — boutique hover reveal, matches Home ── */
const ProductCardGrid = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <div
      className="group relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-1.5"
      style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid transparent' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderTopColor = 'var(--color-accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderTopColor = 'transparent';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square" style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`}>
          <img src={product.image} alt={product.name}
               className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        </Link>

        {/* Wishlist */}
        <button
          onClick={() => {
            if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
            else            { addToWishlist(product);          toast.success('Added to wishlist 💛'); }
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center
                     justify-center transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}>
          <FiHeart size={12}
            fill={wishlisted ? 'var(--color-accent)' : 'none'}
            color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
        </button>

        {/* Category label — plain text, not a filled pill */}
        <span
          className="absolute top-2.5 left-2.5 text-[9px] font-medium uppercase tracking-[0.15em] capitalize"
          style={{ color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
          {product.category}
        </span>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <span className="text-[10px] font-medium uppercase tracking-widest px-3 py-1.5"
                  style={{ border: '1px solid var(--color-dark)', color: 'var(--color-dark)' }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Slide-up add-to-cart bar, revealed on hover (desktop) */}
        {product.stock > 0 && (
          <button
            onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
            className="hidden sm:flex absolute left-0 right-0 bottom-0 items-center justify-center gap-2 py-2.5
                       text-[11px] font-medium uppercase tracking-wider text-white
                       translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out"
            style={{ backgroundColor: 'var(--color-dark)' }}>
            <FiShoppingCart size={11} /> Add to Cart
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 sm:p-4">
        <p className="text-[10px] mb-0.5 truncate uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
          {product.brand}
        </p>
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
          {/* Mobile-only compact add button — desktop uses the slide-up bar */}
          <button
            disabled={product.stock === 0}
            onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
            className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full
                       text-xs font-medium text-white transition-all duration-200
                       hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={12} />
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
    <div className="group relative bg-white overflow-hidden flex transition-all duration-300"
         style={{ boxShadow: 'var(--shadow-card)', borderLeft: '2px solid transparent' }}
         onMouseEnter={e => { e.currentTarget.style.borderLeftColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
         onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>

      <div className="relative w-24 sm:w-40 shrink-0 overflow-hidden"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${product._id}`} className="block h-full">
          <img src={product.image} alt={product.name}
               className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        </Link>
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <span className="text-[9px] font-medium uppercase tracking-widest px-2 py-1"
                  style={{ border: '1px solid var(--color-dark)', color: 'var(--color-dark)' }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-6 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] mb-0.5 truncate uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                {product.brand}
              </p>
              <Link to={`/products/${product._id}`}>
                <h3 className="text-sm font-semibold leading-snug hover:underline mb-1 line-clamp-2"
                    style={{ color: 'var(--color-dark)' }}>{product.name}</h3>
              </Link>
            </div>
            <span className="hidden sm:inline text-[10px] font-medium uppercase tracking-[0.15em] capitalize shrink-0"
                  style={{ color: 'var(--color-accent)' }}>
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
                fill={wishlisted ? 'var(--color-accent)' : 'none'}
                color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
            </button>
            <button
              disabled={product.stock === 0}
              onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 text-xs font-medium uppercase tracking-wider
                         text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-dark)' }}>
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
  <div className="space-y-8">

    {/* Category */}
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3.5" style={{ color: 'var(--color-accent)' }}>
        Category
      </p>
      <div className="space-y-0.5">
        {categories.map(({ label, value }) => (
          <button key={value}
            onClick={() => { updateFilter('category', value); setSidebarOpen(false); }}
            className="group w-full flex items-center gap-2 text-left py-2 text-sm transition-all duration-200"
            style={{ color: filters.category === value ? 'var(--color-dark)' : 'var(--color-muted)' }}>
            <span
              className="block h-px transition-all duration-300"
              style={{
                width: filters.category === value ? '14px' : '0px',
                backgroundColor: 'var(--color-accent)',
              }}
            />
            <span className={filters.category === value ? 'font-medium' : ''}>{label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Price */}
    <div style={{ borderTop: '1px solid var(--color-soft)', paddingTop: '1.75rem' }}>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3.5" style={{ color: 'var(--color-accent)' }}>
        Price Range (₹)
      </p>
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
          className="w-full mt-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white"
          style={{ backgroundColor: 'var(--color-dark)' }}>
          Apply Price Filter
        </button>
      )}
    </div>

    {/* Rating */}
    <div style={{ borderTop: '1px solid var(--color-soft)', paddingTop: '1.75rem' }}>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3.5" style={{ color: 'var(--color-accent)' }}>
        Min Rating
      </p>
      <div className="space-y-1">
        {[4, 3, 2].map(r => (
          <button key={r}
            onClick={() => updateFilter('minRating', filters.minRating === r ? '' : r)}
            className="w-full flex items-center gap-2 py-2 text-sm transition-all"
            style={{ color: 'var(--color-dark)' }}>
            <span
              className="block h-px transition-all duration-300"
              style={{
                width: filters.minRating === r ? '14px' : '0px',
                backgroundColor: 'var(--color-accent)',
              }}
            />
            <Stars rating={r} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>& above</span>
          </button>
        ))}
      </div>
    </div>

    {activeFilterCount > 0 && (
      <button onClick={clearFilters}
        className="w-full py-2.5 text-[11px] font-medium uppercase tracking-wider transition-all"
        style={{ border: '1px solid var(--color-dark)', color: 'var(--color-dark)' }}>
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

      {/* Page Header — dark editorial banner with hairline eyebrow */}
      <div className="relative overflow-hidden" style={{ minHeight: 'clamp(180px, 32vw, 340px)', backgroundColor: 'var(--color-dark)' }}>
        {homeMedia.length > 0 && <HomeMediaBackground media={homeMedia} />}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(26,46,26,0.92) 0%, rgba(26,46,26,0.65) 55%, rgba(26,46,26,0.35) 100%)',
          zIndex: 1,
        }} />
        <div className="relative h-full flex flex-col justify-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
             style={{ zIndex: 2, paddingTop: 'clamp(28px, 5vw, 64px)', paddingBottom: 'clamp(28px, 5vw, 64px)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <span style={{ width: '24px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
            <p className="uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)', fontSize: 'clamp(9px, 1.5vw, 11px)' }}>
              Our Collection
            </p>
          </div>
          <h1 className="font-semibold text-white leading-tight mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4.5vw, 46px)' }}>
            All Products
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(11px, 1.8vw, 14px)' }}>
            {total > 0 ? `${total} products found` : 'Explore our full range of hair care'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">

        {/* Search + Controls */}
        <div className="flex flex-col gap-3 mb-8">

          {/* Row 1: Search — hairline underline style */}
          <form onSubmit={handleSearch} className="relative w-full">
            <FiSearch size={16} className="absolute left-1 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search hair oils, shampoos, brands..."
              className="w-full pl-7 pr-20 py-3 bg-transparent text-sm focus:outline-none"
              style={{ borderBottom: '1.5px solid var(--color-soft)', color: 'var(--color-dark)' }}
              onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--color-accent)'}
              onBlurCapture={e => e.currentTarget.style.borderBottomColor = 'var(--color-soft)'}
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
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--color-primary)' }}>
              Search
            </button>
          </form>

          {/* Row 2: Sort + Filter + View toggle */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <select
                value={filters.sort}
                onChange={e => updateFilter('sort', e.target.value)}
                className="w-full appearance-none cursor-pointer text-sm pr-8 py-2.5 bg-transparent focus:outline-none"
                style={{ color: 'var(--color-dark)', borderBottom: '1px solid var(--color-soft)' }}>
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FiChevronDown size={14}
                className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-muted)' }} />
            </div>

            <button onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
                         transition-all lg:hidden relative shrink-0"
              style={{ border: '1px solid var(--color-soft)', color: 'var(--color-dark)' }}>
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

            <div className="flex items-center gap-1 shrink-0" style={{ border: '1px solid var(--color-soft)' }}>
              {[['grid', <FiGrid size={15} />], ['list', <FiList size={15} />]].map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="p-2.5 transition-all"
                  style={{
                    backgroundColor: viewMode === mode ? 'var(--color-dark)' : 'transparent',
                    color: viewMode === mode ? 'white' : 'var(--color-muted)',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(filters.category || filters.minPrice || filters.maxPrice || filters.search) && (
          <div className="flex flex-wrap items-center gap-4 mb-7 pb-5" style={{ borderBottom: '1px solid var(--color-soft)' }}>
            {filters.search && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-dark)' }}>
                <FiSearch size={11} style={{ color: 'var(--color-muted)' }} /> "{filters.search}"
                <button onClick={() => { updateFilter('search', ''); setSearchInput(''); }} style={{ color: 'var(--color-muted)' }}>
                  <FiX size={11} />
                </button>
              </div>
            )}
            {filters.category && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-dark)' }}>
                {categories.find(c => c.value === filters.category)?.label}
                <button onClick={() => updateFilter('category', '')} style={{ color: 'var(--color-muted)' }}><FiX size={11} /></button>
              </div>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-dark)' }}>
                ₹{filters.minPrice || '0'} — ₹{filters.maxPrice || '∞'}
                <button onClick={() => {
                  setFilters(f => ({ ...f, minPrice: '', maxPrice: '', page: 1 }));
                  setPriceInput({ min: '', max: '' });
                }} style={{ color: 'var(--color-muted)' }}>
                  <FiX size={11} />
                </button>
              </div>
            )}
            <button onClick={clearFilters}
              className="text-xs font-medium uppercase tracking-wide ml-auto"
              style={{ color: 'var(--color-primary)' }}>
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-10">

          {/* Desktop Sidebar */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-dark)' }}>Filters</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white overflow-hidden animate-pulse"
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
                    <div key={i} className="bg-white overflow-hidden flex animate-pulse"
                         style={{ boxShadow: 'var(--shadow-card)', height: '120px' }}>
                      <div className="w-24 sm:w-40 shrink-0" style={{ backgroundColor: 'var(--color-soft)' }} />
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

              <div className="text-center py-24 bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                     style={{ border: '1px solid var(--color-accent)' }}>
                  <FiSearch size={26} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
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
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6'
                  : 'flex flex-col gap-3 sm:gap-4'}>
                  {products.map(product => (
                    viewMode === 'grid'
                      ? <ProductCardGrid key={product._id} product={product} />
                      : <ProductCardList key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mt-14 flex-wrap">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      className="px-3 sm:px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-30"
                      style={{ color: 'var(--color-dark)' }}>
                      ← Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i}
                        onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                        className="w-8 h-8 sm:w-9 sm:h-9 text-sm font-medium transition-all relative"
                        style={{ color: filters.page === i + 1 ? 'var(--color-dark)' : 'var(--color-muted)' }}>
                        {i + 1}
                        {filters.page === i + 1 && (
                          <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-px w-4"
                                style={{ backgroundColor: 'var(--color-accent)' }} />
                        )}
                      </button>
                    ))}
                    <button
                      disabled={filters.page === totalPages}
                      onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      className="px-3 sm:px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-30"
                      style={{ color: 'var(--color-dark)' }}>
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
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden"
               onClick={() => setSidebarOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6
                          max-h-[80vh] overflow-y-auto lg:hidden"
               style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)', borderTop: '2px solid var(--color-accent)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: 'var(--color-dark)' }}>
                <FiFilter size={14} /> Filters
              </h3>
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--color-muted)' }}>
                <FiX size={20} />
              </button>
            </div>
            <Sidebar {...sidebarProps} />
            <button onClick={() => setSidebarOpen(false)}
              className="w-full mt-6 py-3.5 text-white font-medium text-xs uppercase tracking-wider"
              style={{ backgroundColor: 'var(--color-dark)' }}>
              Show Results ({total})
            </button>
          </div>
        </>
      )}
    </div>
  );
}