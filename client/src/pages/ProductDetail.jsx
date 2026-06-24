import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiStar, FiShoppingCart, FiHeart, FiArrowLeft,
  FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus,
  FiShare2, FiCheck, FiUser, FiPackage, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { resolveComboPrice } from '../services/deliveryService';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

/* ── Stars ── */
const Stars = ({ rating, size = 14, interactive = false, onRate }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <FiStar key={i} size={size}
        fill={i <= Math.round(rating) ? 'var(--color-accent)' : 'none'}
        color={i <= Math.round(rating) ? 'var(--color-accent)' : 'var(--color-muted)'}
        className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        onClick={() => interactive && onRate && onRate(i)}
      />
    ))}
  </div>
);

/* ── Skeleton ── */
const Skeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="aspect-square rounded-3xl"
           style={{ backgroundColor: 'var(--color-soft)' }} />
      <div className="space-y-4 pt-4">
        {[80, 60, 40, 40, 100, 60].map((w, i) => (
          <div key={i} className="h-4 rounded-full"
               style={{ backgroundColor: 'var(--color-soft)', width: `${w}%` }} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Return Policy Badge ── */
const ReturnPolicyBadge = ({ returnPolicy }) => {
  if (!returnPolicy) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {returnPolicy.returnable ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5
                         rounded-full text-xs font-medium"
              style={{ backgroundColor: '#F0FDF4', color: '#059669' }}>
          <FiRefreshCw size={11} />
          {returnPolicy.returnDays || 7}-day return policy
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5
                         rounded-full text-xs font-medium"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
          <FiX size={11} />
          Non-returnable
        </span>
      )}
      {returnPolicy.description && (
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          · {returnPolicy.description}
        </span>
      )}
    </div>
  );
};

export default function ProductDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { userInfo } = useAuth();
  const { addToCart }   = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const [product, setProduct]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [quantity, setQuantity]   = useState(1);
  const [added, setAdded]         = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedVariant, setSelectedVariant] = useState(null); // chosen size variant
  const [crossCombos, setCrossCombos]         = useState([]);   // active combo offers for this product

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        setActiveImage(0);
        // Default to smallest (first) variant if variants exist
        if (data.variants?.length) setSelectedVariant(data.variants[0]);
        const rel = await api.get(`/products?category=${data.category}&limit=4`);
        setRelated(rel.data.products.filter(p => p._id !== id));

        // Fetch cross-product combo offers that include this product
        try {
          const { data: offers } = await api.get('/combo-offers');
          const mine = offers.filter(o =>
            o.isActive &&
            o.products.some(p => (p.product?._id || p.product) === id)
          );
          setCrossCombos(mine);
        } catch { /* non-critical */ }
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    const productWithVariant = selectedVariant
      ? { ...product, price: selectedVariant.price, stock: selectedVariant.stock,
          selectedVariantLabel: selectedVariant.label, effectivePrice: selectedVariant.price }
      : product;
    addToCart(productWithVariant, quantity);
    setAdded(true);
    toast.success('Added to cart 🛒');
    setTimeout(() => setAdded(false), 2000);
  };

  const wishlisted = product ? isWishlisted(product._id) : false;
  const handleWishlist = () => {
    if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
    else            { addToWishlist(product);           toast.success('Added to wishlist 💛'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!userInfo)               return toast.error('Please login to leave a review');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    try {
      setSubmitting(true);
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted! 🌟');
      setReviewForm({ rating: 5, comment: '' });
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) return <Skeleton />;
  if (!product) return null;

  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock     = activeStock > 0;
  const ratingBreakdown = [5,4,3,2,1].map(star => ({
    star,
    count: product.reviews?.filter(r => Math.round(r.rating) === star).length || 0,
    pct:   product.numReviews
      ? Math.round((product.reviews?.filter(r => Math.round(r.rating) === star).length
          / product.numReviews) * 100)
      : 0,
  }));

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-8 flex-wrap"
             style={{ color: 'var(--color-muted)' }}>
          <Link to="/"        className="hover:underline">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:underline">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`}
                className="hover:underline capitalize">{product.category}</Link>
          <span>/</span>
          <span className="line-clamp-1"
                style={{ color: 'var(--color-dark)' }}>{product.name}</span>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">

          {/* LEFT — Images */}
          <div className="space-y-3">

            {/* Main image + vertical thumbnails */}
            <div className="flex gap-3">

              {/* Vertical thumbnail strip — desktop only */}
              {product.images?.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className="w-16 h-16 rounded-xl overflow-hidden transition-all shrink-0"
                      style={{
                        border: activeImage === i
                          ? '2.5px solid var(--color-primary)'
                          : '2.5px solid transparent',
                        backgroundColor: 'var(--color-soft)',
                        opacity: activeImage === i ? 1 : 0.65,
                      }}>
                      <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden aspect-square group flex-1"
                   style={{ backgroundColor: 'var(--color-soft)' }}>
                <img
                  src={product.images?.[activeImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Top left badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium capitalize text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                    {product.category}
                  </span>
                  {!inStock && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Share button */}
                <button onClick={handleShare}
                  className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full
                             flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                  <FiShare2 size={15} style={{ color: 'var(--color-muted)' }} />
                </button>

                {/* Arrow navigation */}
                {product.images?.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage(i => (i - 1 + product.images.length) % product.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8
                                 bg-white/80 rounded-full flex items-center justify-center
                                 shadow-md hover:bg-white transition-all text-lg font-bold"
                      style={{ color: 'var(--color-dark)' }}>
                      ‹
                    </button>
                    <button
                      onClick={() => setActiveImage(i => (i + 1) % product.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8
                                 bg-white/80 rounded-full flex items-center justify-center
                                 shadow-md hover:bg-white transition-all text-lg font-bold"
                      style={{ color: 'var(--color-dark)' }}>
                      ›
                    </button>
                  </>
                )}

                {/* Image counter */}
                {product.images?.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full">
                    {activeImage + 1} / {product.images.length}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails — mobile only */}
            {product.images?.length > 1 && (
              <div className="flex md:hidden gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className="flex-1 aspect-square rounded-xl overflow-hidden transition-all"
                    style={{
                      border: activeImage === i
                        ? '2.5px solid var(--color-primary)'
                        : '2.5px solid transparent',
                      backgroundColor: 'var(--color-soft)',
                      opacity: activeImage === i ? 1 : 0.7,
                    }}>
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FiTruck size={15} />,     text: 'Free ₹999+' },
                { icon: <FiShield size={15} />,    text: 'Authentic'   },
                {
                  icon: product.returnPolicy?.returnable
                    ? <FiRefreshCw size={15} />
                    : <FiX size={15} />,
                  text: product.returnPolicy?.returnable
                    ? `${product.returnPolicy.returnDays || 7}-day return`
                    : 'No returns',
                },
              ].map(({ icon, text }) => (
                <div key={text}
                     className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center bg-white"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>


          {/* RIGHT — Details */}
          <div className="flex flex-col gap-5 pt-2">

            {/* Brand */}
            <p className="text-xs font-medium uppercase tracking-widest"
               style={{ color: 'var(--color-accent)' }}>
              {product.brand}
            </p>

            {/* Name */}
            <h1 className="text-3xl font-semibold leading-snug"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <Stars rating={product.rating} size={16} />
              <span className="text-sm font-medium"
                    style={{ color: 'var(--color-dark)' }}>
                {product.rating?.toFixed(1)}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {(() => {
                const basePrice      = selectedVariant ? selectedVariant.price : product.price;
                const effectivePrice = resolveComboPrice(basePrice, product.comboPrices, quantity);
                const mrp            = selectedVariant
                  ? Math.round(selectedVariant.price * 1.2)
                  : Math.round(product.price * 1.2);
                const discountPct    = Math.round(((mrp - effectivePrice) / mrp) * 100);
                return (
                  <>
                    <span className="text-4xl font-semibold"
                          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                      ₹{effectivePrice}
                    </span>
                    <span className="text-sm line-through" style={{ color: 'var(--color-muted)' }}>
                      ₹{mrp}
                    </span>
                    {effectivePrice < basePrice
                      ? <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
                          Combo price!
                        </span>
                      : <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
                          {discountPct}% off
                        </span>
                    }
                  </>
                );
              })()}
            </div>

            {/* Combo pricing tiers */}
            {product.comboPrices?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest"
                   style={{ color: 'var(--color-muted)' }}>Combo deals</p>
                <div className="flex flex-wrap gap-2">
                  {product.comboPrices.map((tier, i) => {
                    const active = quantity >= tier.quantity;
                    return (
                      <div key={i}
                           className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                           style={{
                             borderColor: active ? 'var(--color-primary)' : 'var(--color-soft)',
                             backgroundColor: active ? 'var(--color-soft)' : 'white',
                             color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                           }}>
                        {tier.label || `Buy ${tier.quantity}+`} → ₹{tier.price}/unit
                        {active && <span className="ml-1">✓</span>}
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const next = product.comboPrices.find(t => quantity < t.quantity);
                  if (!next) return null;
                  return (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Add {next.quantity - quantity} more to unlock ₹{next.price}/unit
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm font-medium"
                    style={{ color: inStock ? '#22c55e' : '#ef4444' }}>
                {inStock ? `In Stock (${activeStock} left)` : 'Out of Stock'}
              </span>
            </div>

            {/* ── RETURN POLICY BADGE — dynamic ── */}
            <ReturnPolicyBadge returnPolicy={product.returnPolicy} />

            {/* Short description */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {product.description?.slice(0, 180)}
              {product.description?.length > 180 ? '...' : ''}
            </p>

            <div className="h-px" style={{ backgroundColor: 'var(--color-soft)' }} />

            {/* Size / Volume variant picker */}
            {product.variants?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                   style={{ color: 'var(--color-muted)' }}>Select Size</p>

                {/* Dropdown trigger */}
                <div className="relative">
                  <details className="group" id="variant-dropdown">
                    {/* Selected variant display — acts as dropdown trigger */}
                    <summary
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl
                                 cursor-pointer list-none transition-all"
                      style={{
                        border: '2px solid var(--color-primary)',
                        backgroundColor: 'var(--color-soft)',
                      }}
                    >
                      {selectedVariant ? (
                        <div className="flex items-center justify-between w-full pr-2">
                          <div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                              {selectedVariant.label}
                            </span>
                            <span className="ml-3 text-base font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                              ₹{selectedVariant.price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedVariant.stock === 0 ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">Out of stock</span>
                            ) : (
                              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>In stock</span>
                            )}
                            <svg className="w-4 h-4 transition-transform group-open:rotate-180"
                                 style={{ color: 'var(--color-primary)' }}
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Choose a size…</span>
                      )}
                    </summary>

                    {/* Dropdown options */}
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl overflow-hidden"
                         style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', backgroundColor: 'white', border: '1px solid var(--color-soft)' }}>
                      {product.variants.map((v, i) => {
                        const active      = selectedVariant?.label === v.label;
                        const outOfStock  = v.stock === 0;
                        const basePrice   = product.price;
                        const discount    = basePrice > v.price
                          ? Math.round(((basePrice - v.price) / basePrice) * 100)
                          : null;

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={outOfStock}
                            onClick={() => {
                              setSelectedVariant(v);
                              setQuantity(1);
                              document.getElementById('variant-dropdown')?.removeAttribute('open');
                            }}
                            className="w-full flex items-center justify-between px-4 py-3.5
                                       transition-all text-left"
                            style={{
                              backgroundColor: active ? 'var(--color-soft)' : 'white',
                              borderBottom: i < product.variants.length - 1 ? '1px solid var(--color-soft)' : 'none',
                              opacity: outOfStock ? 0.5 : 1,
                              cursor: outOfStock ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!outOfStock) e.currentTarget.style.backgroundColor = 'var(--color-soft)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'white'; }}
                          >
                            {/* Left — size + price */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: active ? 'var(--color-primary)' : 'var(--color-dark)' }}>
                                  {v.label}
                                </span>
                                {active && (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                       stroke="var(--color-primary)" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                                  ₹{v.price}
                                </span>
                                {discount > 0 && (
                                  <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                                    {discount}% off
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right — stock */}
                            <div className="shrink-0 text-right">
                              {outOfStock ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400 font-medium">
                                  Out of stock
                                </span>
                              ) : v.stock <= 5 ? (
                                <span className="text-xs px-2 py-1 rounded-full font-medium"
                                      style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                                  Only {v.stock} left
                                </span>
                              ) : (
                                <span className="text-xs font-medium" style={{ color: '#22c55e' }}>
                                  In stock
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                 style={{ color: 'var(--color-muted)' }}>Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full overflow-hidden"
                     style={{ border: '1.5px solid var(--color-soft)' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center
                               transition-colors hover:bg-soft"
                    style={{ color: 'var(--color-dark)' }}>
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold"
                        style={{ color: 'var(--color-dark)' }}>
                    {quantity}
                  </span>
                  <button onClick={() => setQuantity(q =>
                    Math.min(activeStock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center transition-colors"
                    style={{ color: 'var(--color-dark)' }}>
                    <FiPlus size={14} />
                  </button>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Max {product.stock} units
                </span>
              </div>
            </div>

            {/* Cross-product combo offer banners */}
            {crossCombos.length > 0 && (
              <div className="space-y-2">
                {crossCombos.map(offer => {
                  const otherProducts = offer.products.filter(
                    p => (p.product?._id || p.product) !== id
                  );
                  const discountLabel =
                    offer.discountType === 'flat'    ? `Save ₹${offer.discountValue}`  :
                    offer.discountType === 'percent' ? `${offer.discountValue}% off`    :
                                                      `Bundle ₹${offer.discountValue}`;
                  return (
                    <div key={offer._id}
                         className="flex items-start gap-3 p-3.5 rounded-2xl"
                         style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                      <span className="text-lg shrink-0">🎁</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
                            {offer.name}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-600 text-white">
                            {offer.badge || discountLabel}
                          </span>
                        </div>
                        {offer.description && (
                          <p className="text-xs mt-0.5" style={{ color: '#166534' }}>
                            {offer.description}
                          </p>
                        )}
                        {otherProducts.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs" style={{ color: '#166534' }}>Bundle with:</span>
                            {otherProducts.map((p, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white"
                                   style={{ border: '1px solid #bbf7d0' }}>
                                {p.product?.image && (
                                  <img src={p.product.image} alt=""
                                       className="w-5 h-5 rounded object-cover shrink-0" />
                                )}
                                <span className="text-xs font-medium truncate max-w-[120px]"
                                      style={{ color: '#15803d' }}>
                                  {p.product?.name || 'Product'}
                                  {p.variantLabel && ` · ${p.variantLabel}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 py-3.5
                           rounded-full text-sm font-medium text-white transition-all
                           duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: added ? '#22c55e' : 'var(--color-primary)' }}>
                {added
                  ? <><FiCheck size={16} /> Added!</>
                  : <><FiShoppingCart size={16} /> Add to Cart</>}
              </button>

              <button onClick={handleWishlist}
                className="w-12 h-12 rounded-full flex items-center justify-center
                           transition-all duration-200 hover:scale-110 shrink-0"
                style={{
                  backgroundColor: wishlisted ? '#FEF3E2' : 'var(--color-soft)',
                  border: wishlisted
                    ? '1.5px solid var(--color-accent)'
                    : '1.5px solid var(--color-soft)',
                }}>
                <FiHeart size={18}
                  fill={wishlisted ? 'var(--color-accent)' : 'none'}
                  color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
              </button>
            </div>

            {/* Buy now */}
            <button
              onClick={() => { handleAddToCart(); navigate('/cart'); }}
              disabled={!inStock}
              className="w-full py-3.5 rounded-full text-sm font-medium
                         transition-all disabled:opacity-40"
              style={{
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
              }}>
              Buy Now
            </button>

          </div>
        </div>

        {/* Tabs */}
        <div className="mb-10">
          <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8 overflow-x-auto"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            {[
              { key: 'description', label: 'Description' },
              { key: 'reviews',     label: `Reviews (${product.numReviews})` },
              // { key: 'how-to',      label: 'How to Use'  },
              { key: 'return',      label: 'Return Policy' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium
                           transition-all duration-200 whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === key ? 'white' : 'transparent',
                  color: activeTab === key ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: activeTab === key ? 'var(--shadow-card)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="bg-white rounded-2xl p-6"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold mb-4"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                About this product
              </h3>
              <p className="text-sm leading-relaxed mb-6"
                 style={{ color: 'var(--color-muted)' }}>
                {product.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Brand',    value: product.brand },
                  { label: 'Category', value: product.category },
                  { label: 'Stock',    value: `${product.stock} units` },
                  { label: 'Rating',   value: `${product.rating?.toFixed(1)} / 5` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl text-center"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      {label}
                    </p>
                    <p className="text-sm font-semibold capitalize"
                       style={{ color: 'var(--color-dark)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="text-center shrink-0">
                    <p className="text-6xl font-semibold mb-2"
                       style={{ fontFamily: 'var(--font-serif)',
                                color: 'var(--color-primary)' }}>
                      {product.rating?.toFixed(1)}
                    </p>
                    <Stars rating={product.rating} size={18} />
                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                      {product.numReviews} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {ratingBreakdown.map(({ star, count, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs w-3 shrink-0"
                              style={{ color: 'var(--color-muted)' }}>{star}</span>
                        <FiStar size={11} fill="var(--color-accent)"
                                color="var(--color-accent)" />
                        <div className="flex-1 h-2 rounded-full overflow-hidden"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                               style={{ width: `${pct}%`,
                                        backgroundColor: 'var(--color-accent)' }} />
                        </div>
                        <span className="text-xs w-6 shrink-0"
                              style={{ color: 'var(--color-muted)' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {userInfo ? (
                <div className="bg-white rounded-2xl p-6"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <h4 className="text-base font-semibold mb-4"
                      style={{ color: 'var(--color-dark)' }}>Write a Review</h4>
                  <form onSubmit={handleReview} className="space-y-4">
                    <div>
                      <p className="text-xs font-medium mb-2"
                         style={{ color: 'var(--color-muted)' }}>Your rating</p>
                      <Stars rating={reviewForm.rating} size={24} interactive
                             onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2"
                         style={{ color: 'var(--color-muted)' }}>Your comment</p>
                      <textarea rows={3} value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({
                          ...f, comment: e.target.value
                        }))}
                        placeholder="Share your experience..."
                        className="input resize-none" />
                    </div>
                    <button type="submit" disabled={submitting}
                      className="px-6 py-2.5 rounded-full text-sm font-medium
                                 text-white disabled:opacity-60 transition-all"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
                    Login to leave a review
                  </p>
                  <Link to="/login" className="btn-primary">Login</Link>
                </div>
              )}

              {product.reviews?.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    No reviews yet — be the first!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {product.reviews?.map(review => (
                    <div key={review._id} className="bg-white rounded-2xl p-5"
                         style={{ boxShadow: 'var(--shadow-card)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center
                                          justify-center text-sm font-bold text-white shrink-0"
                               style={{ backgroundColor: 'var(--color-primary)' }}>
                            {review.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium"
                               style={{ color: 'var(--color-dark)' }}>
                              {review.name}
                            </p>
                            <Stars rating={review.rating} size={12} />
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed"
                         style={{ color: 'var(--color-muted)' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How to Use Tab */}
          {activeTab === 'how-to' && (
            <div className="bg-white rounded-2xl p-6"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold mb-6"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                How to Use
              </h3>
              <div className="space-y-5">
                {[
                  { step: '01', title: 'Prepare',
                    desc: 'Start with clean, slightly damp hair for best absorption.' },
                  { step: '02', title: 'Apply',
                    desc: 'Take a small amount and distribute evenly, focusing on ends.' },
                  { step: '03', title: 'Massage',
                    desc: 'Gently massage into scalp using circular motions.' },
                  { step: '04', title: 'Wait',
                    desc: 'Leave on for 30 minutes, or overnight for deep conditioning.' },
                  { step: '05', title: 'Rinse',
                    desc: 'Wash off thoroughly with gentle shampoo and lukewarm water.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center
                                    text-xs font-bold text-white shrink-0"
                         style={{ backgroundColor: 'var(--color-primary)' }}>
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1"
                         style={{ color: 'var(--color-dark)' }}>{title}</p>
                      <p className="text-sm leading-relaxed"
                         style={{ color: 'var(--color-muted)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RETURN POLICY TAB — fully dynamic ── */}
          {activeTab === 'return' && (
            <div className="bg-white rounded-2xl p-6"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold mb-6"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                Return Policy
              </h3>

              {product.returnPolicy?.returnable ? (
                <div className="space-y-5">

                  {/* Eligible badge */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                       style={{ backgroundColor: '#F0FDF4' }}>
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center
                                    justify-center shrink-0">
                      <FiRefreshCw size={18} color="white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        {product.returnPolicy.returnDays || 7}-Day Return Policy
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        This product is eligible for returns
                      </p>
                    </div>
                  </div>

                  {/* Policy note */}
                  {product.returnPolicy.description && (
                    <div className="p-4 rounded-xl"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                         style={{ color: 'var(--color-muted)' }}>Policy Note</p>
                      <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                        {product.returnPolicy.description}
                      </p>
                    </div>
                  )}

                  {/* Return steps */}
                  <div>
                    <p className="text-sm font-semibold mb-4"
                       style={{ color: 'var(--color-dark)' }}>
                      How to return this product:
                    </p>
                    <div className="space-y-4">
                      {[
                        {
                          step: '01',
                          title: 'Place Return Request',
                          desc: `Go to My Orders → find this order → click "Check Return Eligibility" within ${product.returnPolicy.returnDays || 7} days of delivery.`,
                        },
                        {
                          step: '02',
                          title: 'Select Reason',
                          desc: 'Choose the reason for return and submit your request.',
                        },
                        {
                          step: '03',
                          title: 'Admin Review',
                          desc: 'Our team will review your request within 1-2 business days.',
                        },
                        {
                          step: '04',
                          title: 'Ship the Product',
                          desc: 'Once approved, ship the product back to our address. Keep the original packaging.',
                        },
                        {
                          step: '05',
                          title: 'Refund Processed',
                          desc: 'Refund will be processed within 5-7 business days after we receive the product.',
                        },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full flex items-center
                                          justify-center text-xs font-bold text-white shrink-0"
                               style={{ backgroundColor: '#22c55e' }}>
                            {step}
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-0.5"
                               style={{ color: 'var(--color-dark)' }}>{title}</p>
                            <p className="text-xs leading-relaxed"
                               style={{ color: 'var(--color-muted)' }}>{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return window highlight */}
                  <div className="p-4 rounded-xl flex items-center gap-3"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <FiPackage size={18} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                      You have{' '}
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {product.returnPolicy.returnDays || 7} days
                      </strong>
                      {' '}from the date of delivery to request a return.
                    </p>
                  </div>

                </div>
              ) : (
                /* Non-returnable */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                       style={{ backgroundColor: '#FEF2F2' }}>
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center
                                    justify-center shrink-0">
                      <FiX size={18} color="white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600">
                        Non-Returnable Product
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        This product cannot be returned
                      </p>
                    </div>
                  </div>

                  {product.returnPolicy.description && (
                    <div className="p-4 rounded-xl"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                         style={{ color: 'var(--color-muted)' }}>Reason</p>
                      <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                        {product.returnPolicy.description}
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                       style={{ color: 'var(--color-muted)' }}>
                      Still have issues?
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                      If you received a damaged or wrong product, please contact our
                      support team within 48 hours of delivery with photos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="pb-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-medium mb-1 uppercase tracking-widest"
                   style={{ color: 'var(--color-accent)' }}>You may also like</p>
                <h2 className="text-2xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                  Related Products
                </h2>
              </div>
              <Link to={`/products?category=${product.category}`}
                    className="text-sm" style={{ color: 'var(--color-primary)' }}>
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p._id} to={`/products/${p._id}`}
                      className="bg-white rounded-2xl overflow-hidden group
                                 transition-all duration-300 hover:-translate-y-1"
                      style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="aspect-square overflow-hidden"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={p.image} alt={p.name}
                         className="w-full h-full object-cover group-hover:scale-105
                                    transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs mb-0.5"
                       style={{ color: 'var(--color-muted)' }}>{p.brand}</p>
                    <p className="text-xs font-semibold line-clamp-2 mb-1"
                       style={{ color: 'var(--color-dark)' }}>{p.name}</p>
                    <p className="text-sm font-semibold"
                       style={{ color: 'var(--color-primary)',
                                fontFamily: 'var(--font-serif)' }}>
                      ₹{p.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}