import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiStar, FiShoppingCart, FiHeart, FiArrowLeft,
  FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus,
  FiShare2, FiCheck, FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCart } from '../context/CartContext';
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
      <div className="aspect-square rounded-3xl" style={{ backgroundColor: 'var(--color-soft)' }} />
      <div className="space-y-4 pt-4">
        {[80, 60, 40, 40, 100, 60].map((w, i) => (
          <div key={i} className={`h-4 rounded-full w-${w === 100 ? 'full' : `[${w}%]`}`}
               style={{ backgroundColor: 'var(--color-soft)', width: `${w}%` }} />
        ))}
      </div>
    </div>
  </div>
);

export default function ProductDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { userInfo } = useAuth();
  const { addToCart }                               = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const [product, setProduct]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded]       = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description'); // description | reviews | how-to

  /* Review form */
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  /* Fetch product */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        /* Fetch related — same category */
        const rel = await api.get(`/products?category=${data.category}&limit=4`);
        setRelated(rel.data.products.filter(p => p._id !== id));
         setActiveImage(0);
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
    window.scrollTo(0, 0);
  }, [id]);

  /* Add to cart with animation */
  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    toast.success('Added to cart 🛒');
    setTimeout(() => setAdded(false), 2000);
  };

  /* Wishlist */
  const wishlisted = product ? isWishlisted(product._id) : false;
  const handleWishlist = () => {
    if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
    else            { addToWishlist(product);           toast.success('Added to wishlist 💛'); }
  };

  /* Submit review */
  const handleReview = async (e) => {
    e.preventDefault();
    if (!userInfo) return toast.error('Please login to leave a review');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    try {
      setSubmitting(true);
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted! 🌟');
      setReviewForm({ rating: 5, comment: '' });
      /* Refresh product */
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  /* Share */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) return <Skeleton />;
  if (!product) return null;

  const inStock      = product.stock > 0;
  const ratingBreakdown = [5,4,3,2,1].map(star => ({
    star,
    count: product.reviews?.filter(r => Math.round(r.rating) === star).length || 0,
    pct:   product.numReviews
      ? Math.round((product.reviews?.filter(r => Math.round(r.rating) === star).length / product.numReviews) * 100)
      : 0,
  }));

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── BREADCRUMB ── */}
        <div className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--color-muted)' }}>
          <Link to="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:underline">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`}
                className="hover:underline capitalize">{product.category}</Link>
          <span>/</span>
          <span className="line-clamp-1" style={{ color: 'var(--color-dark)' }}>{product.name}</span>
        </div>

        {/* ── MAIN SECTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">

          {/* LEFT — Images */}
<div className="space-y-3">

  {/* Main image */}
  <div className="relative rounded-3xl overflow-hidden aspect-square group"
       style={{ backgroundColor: 'var(--color-soft)' }}>
    <img
      src={product.images?.[activeImage] || product.image}
      alt={product.name}
      className="w-full h-full object-cover transition-transform duration-700
                 group-hover:scale-105"
    />
    {/* Badges */}
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
    {/* Share */}
    <button onClick={handleShare}
      className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center
                 justify-center shadow-md hover:scale-110 transition-transform">
      <FiShare2 size={15} style={{ color: 'var(--color-muted)' }} />
    </button>

    {/* Arrow nav — only if multiple images */}
    {product.images?.length > 1 && (
      <>
        <button
          onClick={() => setActiveImage(i => (i - 1 + product.images.length) % product.images.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80
                     rounded-full flex items-center justify-center shadow-md
                     hover:bg-white transition-all">
          ‹
        </button>
        <button
          onClick={() => setActiveImage(i => (i + 1) % product.images.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80
                     rounded-full flex items-center justify-center shadow-md
                     hover:bg-white transition-all">
          ›
        </button>
      </>
    )}
  </div>

  {/* Thumbnails — only shown if more than 1 image */}
  {product.images?.length > 1 && (
    <div className="flex gap-2">
      {product.images.map((img, i) => (
        <button key={i} onClick={() => setActiveImage(i)}
          className="flex-1 aspect-square rounded-xl overflow-hidden transition-all"
          style={{
            border: activeImage === i
              ? '2px solid var(--color-primary)'
              : '2px solid transparent',
            backgroundColor: 'var(--color-soft)',
          }}>
          <img src={img} alt={`View ${i + 1}`}
               className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  )}

  {/* Perks below image */}
  <div className="grid grid-cols-3 gap-3">
    {[
      { icon: <FiTruck size={15} />,     text: 'Free shipping ₹499+' },
      { icon: <FiShield size={15} />,    text: '100% authentic'      },
      { icon: <FiRefreshCw size={15} />, text: '7-day returns'       },
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

            {/* Brand + name */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2"
                 style={{ color: 'var(--color-accent)' }}>{product.brand}</p>
              <h1 className="text-3xl font-semibold leading-snug mb-3"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                {product.name}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-3">
                <Stars rating={product.rating} size={16} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                  {product.rating?.toFixed(1)}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                ₹{product.price}
              </span>
              <span className="text-sm line-through" style={{ color: 'var(--color-muted)' }}>
                ₹{Math.round(product.price * 1.2)}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
                20% off
              </span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm font-medium"
                    style={{ color: inStock ? '#22c55e' : '#ef4444' }}>
                {inStock ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </span>
            </div>

            {/* Short description */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {product.description?.slice(0, 180)}{product.description?.length > 180 ? '...' : ''}
            </p>

            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: 'var(--color-soft)' }} />

            {/* Quantity */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                 style={{ color: 'var(--color-muted)' }}>Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full overflow-hidden"
                     style={{ border: '1.5px solid var(--color-soft)' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-soft"
                    style={{ color: 'var(--color-dark)' }}>
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold"
                        style={{ color: 'var(--color-dark)' }}>
                    {quantity}
                  </span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
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

            {/* CTA buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full
                           text-sm font-medium text-white transition-all duration-300
                           disabled:opacity-40 disabled:cursor-not-allowed"
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
                  border: wishlisted ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-soft)',
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
              className="w-full py-3.5 rounded-full text-sm font-medium transition-all
                         disabled:opacity-40"
              style={{
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
              }}>
              Buy Now
            </button>

          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mb-10">
          <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            {[
              { key: 'description', label: 'Description'   },
              { key: 'reviews',     label: `Reviews (${product.numReviews})` },
              { key: 'how-to',      label: 'How to Use'    },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: activeTab === key ? 'white' : 'transparent',
                  color: activeTab === key ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: activeTab === key ? 'var(--shadow-card)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Description tab */}
          {activeTab === 'description' && (
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold mb-4"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                About this product
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-muted)' }}>
                {product.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Brand',    value: product.brand    },
                  { label: 'Category', value: product.category },
                  { label: 'Stock',    value: `${product.stock} units` },
                  { label: 'Rating',   value: `${product.rating?.toFixed(1)} / 5` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl text-center"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
                    <p className="text-sm font-semibold capitalize"
                       style={{ color: 'var(--color-dark)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">

              {/* Rating summary */}
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex flex-col md:flex-row gap-8 items-start">

                  {/* Overall */}
                  <div className="text-center shrink-0">
                    <p className="text-6xl font-semibold mb-2"
                       style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                      {product.rating?.toFixed(1)}
                    </p>
                    <Stars rating={product.rating} size={18} />
                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                      {product.numReviews} reviews
                    </p>
                  </div>

                  {/* Breakdown bars */}
                  <div className="flex-1 space-y-2 w-full">
                    {ratingBreakdown.map(({ star, count, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs w-3 shrink-0"
                              style={{ color: 'var(--color-muted)' }}>{star}</span>
                        <FiStar size={11} fill="var(--color-accent)" color="var(--color-accent)" />
                        <div className="flex-1 h-2 rounded-full overflow-hidden"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                               style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }} />
                        </div>
                        <span className="text-xs w-6 shrink-0"
                              style={{ color: 'var(--color-muted)' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Write review */}
              {userInfo ? (
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <h4 className="text-base font-semibold mb-4"
                      style={{ color: 'var(--color-dark)' }}>Write a Review</h4>
                  <form onSubmit={handleReview} className="space-y-4">
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
                        Your rating
                      </p>
                      <Stars rating={reviewForm.rating} size={24} interactive
                             onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
                        Your comment
                      </p>
                      <textarea
                        rows={3}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        className="input resize-none"
                      />
                    </div>
                    <button type="submit" disabled={submitting}
                      className="px-6 py-2.5 rounded-full text-sm font-medium text-white
                                 disabled:opacity-60 transition-all"
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

              {/* Review list */}
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
                          <div className="w-9 h-9 rounded-full flex items-center justify-center
                                          text-sm font-bold text-white shrink-0"
                               style={{ backgroundColor: 'var(--color-primary)' }}>
                            {review.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
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
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How to use tab */}
          {activeTab === 'how-to' && (
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold mb-6"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                How to Use
              </h3>
              <div className="space-y-5">
                {[
                  { step: '01', title: 'Prepare',  desc: 'Start with clean, slightly damp hair for best absorption and results.' },
                  { step: '02', title: 'Apply',    desc: 'Take a small amount and distribute evenly through your hair, focusing on the ends.' },
                  { step: '03', title: 'Massage',  desc: 'Gently massage into scalp using circular motions to boost circulation.' },
                  { step: '04', title: 'Wait',     desc: 'Leave on for at least 30 minutes, or overnight for a deep conditioning treatment.' },
                  { step: '05', title: 'Rinse',    desc: 'Wash off thoroughly with a gentle shampoo and lukewarm water.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center
                                    text-xs font-bold text-white shrink-0"
                         style={{ backgroundColor: 'var(--color-primary)' }}>
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>
                        {title}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RELATED PRODUCTS ── */}
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
                      className="bg-white rounded-2xl overflow-hidden group transition-all
                                 duration-300 hover:-translate-y-1"
                      style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="aspect-square overflow-hidden"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={p.image} alt={p.name}
                         className="w-full h-full object-cover group-hover:scale-105
                                    transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{p.brand}</p>
                    <p className="text-xs font-semibold line-clamp-2 mb-1"
                       style={{ color: 'var(--color-dark)' }}>{p.name}</p>
                    <p className="text-sm font-semibold"
                       style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
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