import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiShoppingCart, FiTrash2, FiArrowLeft,
  FiStar, FiShare2, FiGrid, FiList
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

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

/* ── Empty State ── */
const EmptyWishlist = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="relative mb-6">
      <div className="w-28 h-28 rounded-full flex items-center justify-center"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <FiHeart size={44} style={{ color: 'var(--color-secondary)' }} />
      </div>
      {/* Floating hearts */}
      {['top-0 right-0', 'bottom-2 left-0', 'top-4 left-2'].map((pos, i) => (
        <div key={i}
             className={`absolute ${pos} w-6 h-6 rounded-full flex items-center
                         justify-center animate-pulse`}
             style={{
               backgroundColor: 'var(--color-soft)',
               animationDelay: `${i * 0.3}s`
             }}>
          <FiHeart size={10} fill="var(--color-accent)" color="var(--color-accent)" />
        </div>
      ))}
    </div>

    <h2 className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
      Your wishlist is empty
    </h2>
    <p className="text-sm mb-8 max-w-xs leading-relaxed"
       style={{ color: 'var(--color-muted)' }}>
      Save your favourite products here and come back to them anytime.
      Start exploring our collection!
    </p>
    <Link to="/products"
          className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                     font-medium text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}>
      <FiArrowLeft size={15} /> Explore Products
    </Link>
  </div>
);

/* ── Grid Card ── */
const WishlistCardGrid = ({ item, onRemove, onMoveToCart }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item._id), 300);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/products/${item._id}`);
    toast.success('Product link copied! 🔗');
  };

  return (
    <div className={`bg-white rounded-2xl overflow-hidden group transition-all duration-300
                     hover:-translate-y-1 ${removing ? 'opacity-0 scale-95' : 'opacity-100'}`}
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${item._id}`}>
          <img src={item.image} alt={item.name}
               className="w-full h-full object-cover transition-transform duration-500
                          group-hover:scale-105" />
        </Link>

        {/* Top actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button onClick={handleRemove}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center
                       shadow-md hover:bg-red-50 transition-all hover:scale-110">
            <FiTrash2 size={13} className="text-red-400" />
          </button>
          <button onClick={handleShare}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center
                       shadow-md transition-all hover:scale-110"
            style={{ color: 'var(--color-muted)' }}>
            <FiShare2 size={13} />
          </button>
        </div>

        {/* Category */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs
                        font-medium capitalize text-white"
             style={{ backgroundColor: 'var(--color-primary)' }}>
          {item.category}
        </div>

        {/* Out of stock */}
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full
                             bg-red-100 text-red-500">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover overlay — quick add */}
        {item.stock > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full
                          group-hover:translate-y-0 transition-transform duration-300">
            <button onClick={() => onMoveToCart(item)}
              className="w-full py-2.5 rounded-xl text-xs font-medium text-white
                         flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: 'var(--color-dark)' }}>
              <FiShoppingCart size={13} /> Quick Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{item.brand}</p>
        <Link to={`/products/${item._id}`}>
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-2
                         hover:underline"
              style={{ color: 'var(--color-dark)' }}>{item.name}</h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <Stars rating={item.rating} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            ({item.numReviews})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
              ₹{item.price}
            </span>
            <span className="text-xs ml-2 line-through"
                  style={{ color: 'var(--color-muted)' }}>
              ₹{Math.round(item.price * 1.2)}
            </span>
          </div>
          <button
            onClick={() => onMoveToCart(item)}
            disabled={item.stock === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs
                       font-medium text-white transition-all hover:opacity-90
                       active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={12} /> Add
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── List Card ── */
const WishlistCardList = ({ item, onRemove, onMoveToCart }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item._id), 300);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/products/${item._id}`);
    toast.success('Product link copied! 🔗');
  };

  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex transition-all duration-300
                     ${removing ? 'opacity-0 scale-95' : 'opacity-100'}`}
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Image */}
      <div className="relative w-36 flex-shrink-0 overflow-hidden"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <Link to={`/products/${item._id}`}>
          <img src={item.image} alt={item.name}
               className="w-full h-full object-cover hover:scale-105
                          transition-transform duration-300" />
        </Link>
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold px-2 py-1 rounded-full
                             bg-red-100 text-red-500">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>
                {item.brand}
              </p>
              <Link to={`/products/${item._id}`}>
                <h3 className="text-sm font-semibold leading-snug hover:underline mb-1"
                    style={{ color: 'var(--color-dark)' }}>{item.name}</h3>
              </Link>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs capitalize"
                    style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
                {item.category}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleShare}
                className="p-2 rounded-xl transition-all hover:bg-soft"
                style={{ color: 'var(--color-muted)' }}>
                <FiShare2 size={14} />
              </button>
              <button onClick={handleRemove}
                className="p-2 rounded-xl transition-all hover:bg-red-50">
                <FiTrash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed mt-2 line-clamp-2"
             style={{ color: 'var(--color-muted)' }}>
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stars rating={item.rating} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                ({item.numReviews})
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                ₹{item.price}
              </span>
              <span className="text-xs line-through" style={{ color: 'var(--color-muted)' }}>
                ₹{Math.round(item.price * 1.2)}
              </span>
              <span className="text-xs font-medium text-green-500">20% off</span>
            </div>
          </div>

          <button
            onClick={() => onMoveToCart(item)}
            disabled={item.stock === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm
                       font-medium text-white transition-all hover:opacity-90
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={14} />
            {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   WISHLIST PAGE
══════════════════════════════════════ */
export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState('grid');
  const [addedIds, setAddedIds] = useState([]);

  /* Add one to cart */
  const handleMoveToCart = (item) => {
    addToCart(item);
    setAddedIds(prev => [...prev, item._id]);
    toast.success(`${item.name.slice(0, 30)}... added to cart 🛒`);
    setTimeout(() => setAddedIds(prev => prev.filter(id => id !== item._id)), 2000);
  };

  /* Add all to cart */
  const handleAddAllToCart = () => {
    const inStock = wishlist.filter(i => i.stock > 0);
    if (inStock.length === 0) return toast.error('No in-stock items to add');
    inStock.forEach(item => addToCart(item));
    toast.success(`${inStock.length} items added to cart 🛒`);
  };

  /* Share wishlist */
  const handleShareWishlist = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Wishlist link copied! 🔗');
  };

  /* Summary stats */
  const totalValue  = wishlist.reduce((s, i) => s + i.price, 0);
  const inStockCount = wishlist.filter(i => i.stock > 0).length;

  /* Empty state */
  if (wishlist.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8"
           style={{ backgroundColor: 'var(--color-cream)' }}>
        <EmptyWishlist />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── HEADER ── */}
      <div style={{ backgroundColor: 'var(--color-dark)' }} className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/products"
                className="flex items-center gap-2 text-sm mb-3 hover:opacity-80
                           transition-opacity w-fit"
                style={{ color: 'rgba(255,255,255,0.6)' }}>
            <FiArrowLeft size={14} /> Continue Shopping
          </Link>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FiHeart size={22} fill="var(--color-accent)" color="var(--color-accent)" />
                <h1 className="text-3xl font-semibold text-white"
                    style={{ fontFamily: 'var(--font-serif)' }}>
                  My Wishlist
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                · {inStockCount} in stock
              </p>
            </div>

            {/* Share */}
            <button onClick={handleShareWishlist}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full
                         text-sm transition-all hover:opacity-80"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>
              <FiShare2 size={14} /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Total Items',    value: wishlist.length                             },
            { label: 'In Stock',       value: inStockCount                                },
            { label: 'Total Value',    value: `₹${totalValue.toLocaleString('en-IN')}`   },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-xl font-semibold mb-0.5"
                 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">

          {/* Left — bulk actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleAddAllToCart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm
                         font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <FiShoppingCart size={14} /> Add All to Cart
            </button>

            <button onClick={() => { clearWishlist(); toast.info('Wishlist cleared'); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm
                         font-medium transition-all hover:bg-red-50 hover:text-red-500"
              style={{ border: '1px solid var(--color-soft)', color: 'var(--color-muted)' }}>
              <FiTrash2 size={14} /> Clear All
            </button>
          </div>

          {/* Right — view toggle */}
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

        {/* ── PRODUCTS ── */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlist.map(item => (
              <WishlistCardGrid
                key={item._id}
                item={item}
                onRemove={(id) => {
                  removeFromWishlist(id);
                  toast.info('Removed from wishlist');
                }}
                onMoveToCart={handleMoveToCart}
                added={addedIds.includes(item._id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {wishlist.map(item => (
              <WishlistCardList
                key={item._id}
                item={item}
                onRemove={(id) => {
                  removeFromWishlist(id);
                  toast.info('Removed from wishlist');
                }}
                onMoveToCart={handleMoveToCart}
                added={addedIds.includes(item._id)}
              />
            ))}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div className="mt-12 rounded-3xl p-8 flex flex-col sm:flex-row items-center
                        justify-between gap-6"
             style={{ backgroundColor: 'var(--color-soft)' }}>
          <div>
            <h3 className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Discover more products
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Explore our full collection and find your next favourite
            </p>
          </div>
          <Link to="/products"
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                           font-medium text-sm transition-all hover:opacity-90 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}>
            Shop Now →
          </Link>
        </div>

      </div>
    </div>
  );
}