import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiShoppingCart, FiHeart, FiTruck, FiShield, FiRefreshCw, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';




/* ── tiny reusable star rating ── */
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

/* ── product card ── */
const ProductCard = ({ product }) => {
  const { addToCart }                     = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const handleWishlist = () => {
    if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
    else            { addToWishlist(product);           toast.success('Added to wishlist 💛'); }
  };

  const handleCart = () => {
    addToCart(product);
    toast.success('Added to cart 🛒');
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Image */}
      <div className="relative overflow-hidden aspect-square"
           style={{ backgroundColor: 'var(--color-soft)' }}>
        <img src={product.image} alt={product.name}
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        {/* Wishlist button */}
        <button onClick={handleWishlist}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center
                           justify-center shadow-md transition-transform duration-200 hover:scale-110">
          <FiHeart size={14}
            fill={wishlisted ? '#D4AF8C' : 'none'}
            color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'} />
        </button>

        {/* Category badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize"
             style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          {product.category}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
        <h3 className="text-sm font-semibold mb-2 line-clamp-2 leading-snug"
            style={{ color: 'var(--color-dark)' }}>{product.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.rating} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
            ₹{product.price}
          </span>
          <button onClick={handleCart}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                             text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiShoppingCart size={12} /> Add
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [bannerCoupon, setBannerCoupon] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/products?limit=8&sort=rating_desc');
        setFeatured(data.products);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  

useEffect(() => {
  const fetchBanner = async () => {
    try {
      const { data } = await api.get('/coupons/banner');
      setBannerCoupon(data);
    } catch {
      setBannerCoupon(null);
    }
  };
  fetchBanner();
}, []);

  const categories = [
    { name: 'Hair Oils',    slug: 'hair-oil',    emoji: '🌿', desc: 'Nourish & strengthen'  },
    { name: 'Shampoos',     slug: 'shampoo',     emoji: '🧴', desc: 'Cleanse & refresh'      },
    { name: 'Conditioners', slug: 'conditioner', emoji: '✨', desc: 'Soften & detangle'      },
    { name: 'Hair Masks',   slug: 'hair-mask',   emoji: '🍯', desc: 'Deep treat & repair'   },
    { name: 'Serums',       slug: 'serum',       emoji: '💧', desc: 'Shine & smooth'         },
  ];

  const perks = [
    { icon: <FiTruck size={20} />,     title: 'Free Shipping',    desc: 'On orders above ₹999'         },
    { icon: <FiShield size={20} />,    title: '100% Natural',     desc: 'No harsh chemicals ever'      },
    { icon: <FiRefreshCw size={20} />, title: 'Easy Returns',     desc: '7-day hassle-free returns'    },
    { icon: <FiPhone size={20} />,     title: '24/7 Support',     desc: 'We\'re always here for you'   },
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
                 style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
              100% Natural Ingredients
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Unlock Your
              <span className="block" style={{ color: 'var(--color-primary)' }}>
                Hair's True
              </span>
              Potential.
            </h1>

            <p className="text-base leading-relaxed mb-8 max-w-md"
               style={{ color: 'var(--color-muted)' }}>
              Premium hair care products crafted from nature's finest ingredients —
              because your hair deserves the very best.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/products"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                               font-medium text-sm transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                Shop Now <FiArrowRight size={15} />
              </Link>
              <Link to="/products"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-sm
                               transition-all duration-200"
                    style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                View All
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10">
              {[['10K+', 'Happy customers'], ['50+', 'Products'], ['100%', 'Natural']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-semibold"
                     style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>{num}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual card stack */}
          <div className="relative flex items-center justify-center h-96 md:h-auto">

            {/* Back card */}
            <div className="absolute w-56 h-72 rounded-3xl rotate-6 opacity-40"
                 style={{ backgroundColor: 'var(--color-secondary)' }} />

            {/* Middle card */}
            <div className="absolute w-56 h-72 rounded-3xl -rotate-3 opacity-60"
                 style={{ backgroundColor: 'var(--color-accent)' }} />

            {/* Front card */}
            <div className="relative w-60 h-76 rounded-3xl overflow-hidden shadow-2xl"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
                <div className="text-6xl">🌿</div>
                <div className="text-center">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-dark)' }}>Argan Oil Elixir</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Best Seller</p>
                </div>
                <div className="w-full p-3 rounded-2xl text-center"
                     style={{ backgroundColor: 'white' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>₹599</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute top-4 right-4 bg-white rounded-2xl px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Stars rating={4.8} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>4.8</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>2.4k reviews</p>
            </div>

            <div className="absolute bottom-8 left-0 bg-white rounded-2xl px-3 py-2 shadow-lg">
              <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>🚚 Free delivery</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Orders above ₹999</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERKS BAR ── */}
      <section style={{ backgroundColor: 'var(--color-primary)' }} className="py-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {perks.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="text-white/80">{icon}</div>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-white/60 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-medium mb-1 uppercase tracking-widest"
               style={{ color: 'var(--color-accent)' }}>Browse by</p>
            <h2 className="text-3xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Categories
            </h2>
          </div>
          <Link to="/products"
                className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: 'var(--color-primary)' }}>
            View all <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(({ name, slug, emoji, desc }) => (
            <Link key={slug} to={`/products?category=${slug}`}
                  className="group flex flex-col items-center text-center p-5 rounded-2xl
                             bg-white transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {emoji}
              </div>
              <p className="text-sm font-semibold mb-1"
                 style={{ color: 'var(--color-dark)' }}>{name}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-medium mb-1 uppercase tracking-widest"
               style={{ color: 'var(--color-accent)' }}>Hand picked</p>
            <h2 className="text-3xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Featured Products
            </h2>
          </div>
          <Link to="/products"
                className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: 'var(--color-primary)' }}>
            See all <FiArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          /* Skeleton loader */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square" style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-soft)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-soft)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map(product => (
              <Link key={product._id} to={`/products/${product._id}`}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state — shows until you add products via admin */
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-dark)' }}>No products yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
              Add your first product from the admin dashboard
            </p>
            <Link to="/admin/products/add" className="btn-primary">
              Add Product
            </Link>
          </div>
        )}
      </section>

     {/* ── BANNER ── */}
{bannerCoupon && (
  <section className="max-w-6xl mx-auto px-4 pb-16">
    <div className="rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center
                    justify-between gap-8 relative overflow-hidden"
         style={{ backgroundColor: 'var(--color-dark)' }}>

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
           style={{ backgroundColor: 'var(--color-accent)' }} />
      <div className="absolute -bottom-10 left-20 w-32 h-32 rounded-full opacity-5"
           style={{ backgroundColor: 'var(--color-primary)' }} />

      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-widest mb-2"
           style={{ color: 'var(--color-accent)' }}>Limited time offer</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3"
            style={{ fontFamily: 'var(--font-serif)' }}>
          {bannerCoupon.type === 'percent'
            ? `Get ${bannerCoupon.value}% off`
            : `Get ₹${bannerCoupon.value} off`}
          <br />
          {bannerCoupon.description || 'your next order'}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-white/60 text-sm">
            Use code{' '}
            <span className="font-mono font-bold text-white bg-white/10
                             px-2 py-0.5 rounded">
              {bannerCoupon.code}
            </span>{' '}
            at checkout
          </p>
          {bannerCoupon.minOrder > 0 && (
            <span className="text-xs px-2 py-1 rounded-full text-white/60"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              Min. order ₹{bannerCoupon.minOrder}
            </span>
          )}
          {bannerCoupon.expiresAt && (
            <span className="text-xs px-2 py-1 rounded-full text-white/60"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              Expires {new Date(bannerCoupon.expiresAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
              })}
            </span>
          )}
        </div>
      </div>

      <Link to="/products"
            className="relative z-10 flex items-center gap-2 px-8 py-4 rounded-full
                       font-medium text-sm transition-all duration-200 hover:opacity-90
                       shrink-0"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)' }}>
        Shop Now <FiArrowRight size={15} />
      </Link>
    </div>
  </section>
)}

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-medium mb-1 uppercase tracking-widest"
             style={{ color: 'var(--color-accent)' }}>What they say</p>
          <h2 className="text-3xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Loved by customers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: 'Priya S.',    initial: 'P', review: 'The argan oil completely transformed my dry, frizzy hair in just 2 weeks. I genuinely can\'t live without it now!',          rating: 4 },
            { name: 'Ananya M.',   initial: 'A', review: 'Best shampoo I\'ve ever used. My scalp feels so clean and fresh, and my hair has never looked this shiny before.',          rating: 4 },
            { name: 'Kavitha R.', initial: 'K', review: 'The hair mask is absolutely luxurious. My hair feels so soft and the smell is incredible. Totally worth every rupee!', rating: 5 },
          ].map(({ name, initial, review, rating }) => (
            <div key={name} className="bg-white rounded-2xl p-6"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <Stars rating={rating} />
              <p className="text-sm leading-relaxed my-4 italic"
                 style={{ color: 'var(--color-muted)' }}>"{review}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                     style={{ backgroundColor: 'var(--color-primary)' }}>
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>{name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Verified buyer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}