import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight, FiStar, FiShoppingCart, FiHeart,
  FiTruck, FiShield, FiRefreshCw, FiPhone,
  FiChevronLeft, FiChevronRight, FiPlay, FiVolume2, FiVolumeX,
} from 'react-icons/fi';
import { toast }        from 'react-toastify';
import api              from '../services/api';
import { useCart }      from '../context/CartContext';
import { useWishlist }  from '../context/WishlistContext';
import HeroProduct from './admin/HeroProduct';

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


/* ── Testimonials with infinite auto-scroll ── */
const testimonials = [
  { name: 'Priya S.',     initial: 'P', review: "The argan oil completely transformed my dry, frizzy hair in just 2 weeks. I genuinely can't live without it now!",        rating: 4 },
  { name: 'Ananya M.',    initial: 'A', review: "Best shampoo I've ever used. My scalp feels so clean and fresh, and my hair has never looked this shiny before.",          rating: 4 },
  { name: 'Kavitha R.',   initial: 'K', review: 'The hair mask is absolutely luxurious. My hair feels so soft and the smell is incredible. Totally worth every rupee!',  rating: 5 },
  { name: 'Meera T.',     initial: 'M', review: 'The serum gave my hair an incredible shine after just one use. So lightweight and absolutely no greasiness at all!',      rating: 5 },
  { name: 'Divya L.',     initial: 'D', review: 'Finally found a conditioner that actually detangles without weighing my hair down. My morning routine is so much easier.', rating: 4 },
  { name: 'Sneha R.',     initial: 'S', review: 'The hair mask smells divine and my curls have never looked this defined. Will definitely be repurchasing very soon!',      rating: 5 },
];


// Duplicate for seamless infinite loop
const track = [...testimonials, ...testimonials];

/* ── Product card ── */
const ProductCard = ({ product }) => {
  const { addToCart }                                       = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
   <div
  className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
  style={{ boxShadow: 'var(--shadow-card)' }}
  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-soft)'}
  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
>
  {/* ── Image Section ── */}
  <div
    className="relative overflow-hidden aspect-square "
    style={{ backgroundColor: 'var(--color-soft)' }}
  >
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />

    {/* Wishlist Button */}
    <button
      onClick={() => {
        if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
        else            { addToWishlist(product);          toast.success('Added to wishlist 💛'); }
      }}
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center
                 justify-center transition-transform duration-200 hover:scale-110"
      style={{ boxShadow: '0 2px 8px rgba(58, 125, 68, 0.15)' }}
    >
      <FiHeart
        size={14}
        fill={wishlisted ? 'var(--color-accent)' : 'none'}
        color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'}
      />
    </button>

    {/* Category Badge */}
    <div
      className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize"
      style={{
        backgroundColor: 'var(--color-soft)',
        color: 'var(--color-primary)',
        border: '1px solid var(--color-secondary)',
      }}
    >
      {product.category}
    </div>
  </div>

  {/* ── Card Body ── */}
  <div className="p-4">

    {/* Brand */}
    <p
      className="text-xs mb-1 tracking-wide uppercase"
      style={{ color: 'var(--color-muted)' }}
    >
      {product.brand}
    </p>

    {/* Product Name */}
    <h3
      className="text-sm font-semibold mb-2 line-clamp-2 leading-snug"
      style={{ color: 'var(--color-dark)' }}
    >
      {product.name}
    </h3>

    {/* Rating */}
    <div className="flex items-center gap-2 mb-3">
      <Stars rating={product.rating} />
      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
        ({product.numReviews})
      </span>
    </div>

    {/* Price + Add to Cart */}
    <div className="flex items-center justify-between">
      <span
        className="text-lg font-semibold"
        style={{
          color: 'var(--color-primary)',
          fontFamily: 'var(--font-serif)',
        }}
      >
        ₹{product.price}
      </span>

      <button
        onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                   text-white transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <FiShoppingCart size={12} /> Add
      </button>
    </div>

  </div>
</div>
  );
};

/* ─────────────────────────────────────────
   HOME MEDIA SECTION
   Carousel of admin-uploaded images + videos
───────────────────────────────────────── */
const HomeMediaSection = ({ media }) => {
  const navigate = useNavigate();
  const [index,  setIndex]  = useState(0);
  const [muted,  setMuted]  = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const vidRef   = useRef(null);   // stable ref — never recreated

  const current = media[index];
  const total   = media.length;

  const goTo = (i) => setIndex((i + total) % total);

  // Auto-advance images every 5s
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (current?.type === 'image' && !paused) {
      timerRef.current = setTimeout(() => goTo(index + 1), 5000);
    }
    return () => clearTimeout(timerRef.current);
  }, [index, paused, current]);

  // Every time index changes and a video is current, force-play it.
  // We reset paused to false first so the button shows the right icon.
  useEffect(() => {
    if (current?.type !== 'video') return;
    setPaused(false);
    const vid = vidRef.current;
    if (!vid) return;
    vid.muted  = true;
    vid.volume = 0;
    // Small timeout lets the browser finish swapping src before play()
    const t = setTimeout(() => {
      vid.play().catch(() => {});
    }, 50);
    return () => clearTimeout(t);
  }, [index, current]);

  const handleMuteToggle = () => {
    const vid = vidRef.current;
    if (!vid) return;
    const next  = !muted;
    vid.muted   = next;
    vid.volume  = next ? 0 : 1;
    setMuted(next);
  };

  const handlePlayPause = () => {
    const vid = vidRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  if (!total) return null;

  return (
  <section className="relative w-full overflow-hidden"
           style={{ backgroundColor: 'var(--color-dark)' }}>
    <div className="relative w-full"
         style={{ height: 'clamp(200px, 31.25vw, 430px)' }}>

      {/* SLIDING TRACK */}
      <div
        style={{
          display: 'flex',
          width: `${total * 100}%`,
          height: '100%',
          transform: `translateX(-${(index * 100) / total}%)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {media.map((item, i) => (
          <div
            key={item._id}
            onClick={() => navigate(item.ctaLink || '/products')}
            style={{ width: `${100 / total}%`, height: '100%', flexShrink: 0, position: 'relative', cursor: 'pointer' }}
          >

            {item.type === 'video' ? (
              <video
                ref={i === index ? vidRef : null}
                src={item.url}
                autoPlay={i === index}
                muted
                playsInline
                loop={false}
                onEnded={() => goTo(index + 1)}
                onPlay={() => setPaused(false)}
                onPause={(e) => { if (!e.target.seeking) setPaused(true); }}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  display: 'block',
                }}
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            )}

            {/* Text overlay per slide */}
            {(item.title || item.ctaText) && (
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
                {item.title && (
                  <h2 className="text-2xl md:text-4xl font-semibold text-white leading-tight mb-2"
                      style={{ fontFamily: 'var(--font-serif)' }}>
                    {item.title}
                  </h2>
                )}
                {item.subtitle && (
                  <p className="text-sm md:text-base text-white/80 mb-5">{item.subtitle}</p>
                )}
                {item.ctaText && (
                  <Link to={item.ctaLink || '/products'}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium w-fit transition-all hover:opacity-90"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)' }}>
                    {item.ctaText} <FiArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          {[
            { dir: -1, icon: <FiChevronLeft size={20} />,  pos: 'left-3'  },
            { dir:  1, icon: <FiChevronRight size={20} />, pos: 'right-3' },
          ].map(({ dir, icon, pos }) => (
            <button key={dir} onClick={() => goTo(index + dir)}
              className={`absolute top-1/2 -translate-y-1/2 ${pos} w-9 h-9 rounded-full
                          flex items-center justify-center text-white transition-all
                          hover:scale-110 active:scale-95`}
              style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
              {icon}
            </button>
          ))}

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width:           i === index ? '20px' : '6px',
                  height:          '6px',
                  backgroundColor: i === index ? 'white' : 'rgba(255,255,255,0.4)',
                }} />
            ))}
          </div>
        </>
      )}

      {/* Video controls */}
      {current.type === 'video' && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button onClick={handleMuteToggle}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            {muted ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
          </button>
          <button onClick={handlePlayPause}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            {paused
              ? <FiPlay size={13} />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
            }
          </button>
        </div>
      )}

    </div>
  </section>
);


};

// Lightweight version — just the sliding images, no controls/dots/text
export const HomeMediaBackground = ({ media }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const total = media.length;

  const goTo = (i) => setIndex((i + total) % total);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goTo(index + 1), 5000);
    return () => clearTimeout(timerRef.current);
  }, [index]);

  if (!total) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Sliding track */}
      <div style={{
        display: 'flex',
        width: `${total * 100}%`,
        height: '100%',
        transform: `translateX(-${(index * 100) / total}%)`,
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}>
        {media.map((item) => (
          <div key={item._id} style={{ width: `${100 / total}%`, height: '100%', flexShrink: 0, position: 'relative' }}>
            {item.type === 'video' ? (
              <video
                src={item.url}
                autoPlay muted playsInline loop
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={item.url}
                alt=""
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
export default function Home() {
  const [featured,     setFeatured]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [bannerCoupon,  setBannerCoupon]  = useState(null);
  const [couponLoading, setCouponLoading] = useState(true);
  const [homeMedia,     setHomeMedia]     = useState([]);

  useEffect(() => {
    api.get('/products?limit=8&sort=rating_desc')
      .then(({ data }) => setFeatured(data.products))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/coupons/banner')
      .then(({ data }) => setBannerCoupon(data || null))
      .catch(() => setBannerCoupon(null))
      .finally(() => setCouponLoading(false));

    api.get('/home-media')
      .then(({ data }) => setHomeMedia(data))
      .catch(() => setHomeMedia([]));
  }, []);

  // const categories = [
  //   { name: 'Hair Oils',    slug: 'hair-oil',    emoji: '🌿', desc: 'Nourish & strengthen' },
  //   { name: 'Shampoos',     slug: 'shampoo',     emoji: '🧴', desc: 'Cleanse & refresh'    },
  //   { name: 'Conditioners', slug: 'conditioner', emoji: '✨', desc: 'Soften & detangle'    },
  //   { name: 'Hair Masks',   slug: 'hair-mask',   emoji: '🍯', desc: 'Deep treat & repair'  },
  //   { name: 'Serums',       slug: 'serum',       emoji: '💧', desc: 'Shine & smooth'       },
  // ];

  const categoryIcons = {
  'hair-oil': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 5 6 5 10c0 5 4 9 7 11 3-2 7-6 7-11 0-4-3-8-7-8z"/>
      <path d="M12 6v6M9.5 9.5l2.5 2.5 2.5-2.5"/>
    </svg>
  ),
  'shampoo': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="4" width="10" height="16" rx="3"/>
      <path d="M10 4V2h4v2"/>
      <path d="M10 10h4M10 13h2"/>
    </svg>
  ),
  'conditioner': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="3" width="8" height="18" rx="3"/>
      <path d="M8 8h8"/>
      <path d="M11 3V1.5M13 3V1.5"/>
      <path d="M11 13h2M11 16h2"/>
    </svg>
  ),
  'hair-mask': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l1 4H7L8 3z"/>
      <path d="M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7"/>
      <path d="M10 12h4M10 15h2"/>
    </svg>
  ),
  'serum': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v4l2 10a2 2 0 01-2 2H9a2 2 0 01-2-2L9 7V3z"/>
      <path d="M9 3h6"/>
      <circle cx="12" cy="14" r="2"/>
      <path d="M12 2v1"/>
    </svg>
  ),
};

const categories = [
  { name: 'Hair Oils',    slug: 'hair-oil',    desc: 'Nourish & strengthen' },
  { name: 'Shampoos',     slug: 'shampoo',     desc: 'Cleanse & refresh'    },
  { name: 'Conditioners', slug: 'conditioner', desc: 'Soften & detangle'    },
  { name: 'Hair Masks',   slug: 'hair-mask',   desc: 'Deep treat & repair'  },
  { name: 'Serums',       slug: 'serum',       desc: 'Shine & smooth'       },
];

  const perks = [
    { icon: <FiTruck size={20} />,     title: 'Free Shipping', desc: 'On orders above ₹999'       },
    { icon: <FiShield size={20} />,    title: '100% Natural',  desc: 'No harsh chemicals ever'    },
    { icon: <FiRefreshCw size={20} />, title: 'Easy Returns',  desc: '7-day hassle-free returns'  },
    { icon: <FiPhone size={20} />,     title: '24/7 Support',  desc: "We're always here for you"  },
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>
       {/* ── HOME MEDIA (images + videos uploaded by admin) ── */}
      {homeMedia.length > 0 && <HomeMediaSection media={homeMedia} />}

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
                 style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
              100% Natural Ingredients
            </div>
            <h1
  className="text-5xl md:text-6xl font-semibold leading-tight mb-6"
  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
>
  Elevate Your
  <span className="block" style={{ color: 'var(--color-primary)' }}>
    Beauty Routine
  </span>
</h1>

<p
  className="text-sm leading-relaxed mb-8 max-w-md"
  style={{ color: 'var(--color-muted)' }}
>
  Discover premium beauty and cosmetic essentials crafted to enhance your
  everyday self-care — from skincare and haircare to beauty products you’ll love ♥.
</p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/products"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                               font-medium text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                Shop Now <FiArrowRight size={15} />
              </Link>
              <Link to="/products"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-sm"
                    style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                View All
              </Link>
            </div>
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

          {/* Right card stack */}
        
          <HeroProduct />

        </div>
      </section>

      {/* ── PERKS BAR ── */}
      <section style={{ backgroundColor: 'var(--color-primary)' }} className="py-8">
  <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-2">
    {perks.map(({ icon, title, desc }) => (
      <div
        key={title}
        className="group flex items-center gap-3 px-4 py-3 rounded-xl
                   transition-colors duration-300"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {/* Icon container */}
        <div
          className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center
                     transition-all duration-400
                     group-hover:-translate-y-1 group-hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, border-color 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
        >
          <div className="text-white transition-transform duration-400
                          group-hover:scale-115"
               style={{ transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {icon}
          </div>
        </div>

        {/* Text */}
        <div>
          <p className="text-white text-sm font-medium transition-all duration-300
                        group-hover:tracking-wide">
            {title}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* ── CATEGORIES ── */}
      {/* <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 ">
          <div>
            <p className="text-xs font-medium mb-1 uppercase tracking-widest"
               style={{ color: 'var(--color-accent)' }}>Browse by</p>
            <h2 className="text-3xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Categories
            </h2>
          </div>
          <Link to="/products" className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: 'var(--color-primary)' }}>
            View all <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(({ name, slug, emoji, desc }) => (
            <Link key={slug} to={`/products?category=${slug}`}
                  className="group flex flex-col items-center text-center p-5 rounded-2xl
                              transition-all duration-300 hover:-translate-y-1"
                   style={{
    backgroundColor: 'var(--color-soft)',  
    boxShadow: 'var(--shadow-card)',
  }}>
              <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {emoji}
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>{name}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</p>
            </Link>
          ))}
        </div>
      </section> */}


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
    <Link to="/products" className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
          style={{ color: 'var(--color-primary)' }}>
      View all <FiArrowRight size={14} />
    </Link>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
    {categories.map(({ name, slug, desc }) => (
      <Link
        key={slug}
        to={`/products?category=${slug}`}
        className="group flex flex-col items-center text-center p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1"
        style={{ backgroundColor: 'var(--color-soft)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Icon circle */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            opacity: 0.85,
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, background 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.opacity = '0.85';
          }}
        >
          {categoryIcons[slug]}
        </div>

        <p className="text-sm font-semibold mb-1 transition-colors duration-200"
           style={{ color: 'var(--color-dark)' }}>
          {name}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</p>
      </Link>
    ))}
  </div>
</section>
      
     


      {/* ── FEATURED PRODUCTS ── */}
      <section className="mt-10 max-w-6xl mx-auto px-4 pb-16 ">
        <div className="flex items-end justify-between mb-8 ">
          <div>
            <p className="text-xs font-medium mb-1 uppercase tracking-widest"
               style={{ color: 'var(--color-accent)' }}>Hand picked</p>
            <h2 className="text-3xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Featured Products
            </h2>
          </div>
          <Link to="/products" className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: 'var(--color-primary)' }}>
            See all <FiArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
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
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-dark)' }}>
              No products yet
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
              Add your first product from the admin dashboard
            </p>
            <Link to="/admin/products/add" className="btn-primary">Add Product</Link>
          </div>
        )}
      </section>

      {/* ── COUPON BANNER ── */}
      {/* ── COUPON BANNER ── show when loaded and a banner coupon exists */}
      {!couponLoading && bannerCoupon?.code && (
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
                <br />{bannerCoupon.description || 'your next order'}
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-white/60 text-sm">
                  Use code{' '}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(bannerCoupon.code)
                        .then(() => toast.success(`Code "${bannerCoupon.code}" copied!`))
                        .catch(() => {});
                    }}
                    title="Click to copy"
                    className="font-mono font-bold text-white bg-white/10 px-2 py-0.5
                               rounded cursor-pointer hover:bg-white/20 transition-colors">
                    {bannerCoupon.code}
                  </button>{' '}
                  at checkout
                </p>

                {bannerCoupon.minOrder > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full text-white/60"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    Min. order ₹{bannerCoupon.minOrder.toLocaleString('en-IN')}
                  </span>
                )}

                {bannerCoupon.expiresAt && (
                  <span className="text-xs px-2 py-1 rounded-full text-white/60"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    Expires {new Date(bannerCoupon.expiresAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </span>
                )}
              </div>
            </div>

            <Link to="/products"
                  className="relative z-10 flex items-center gap-2 px-8 py-4 rounded-full
                             font-medium text-sm transition-all hover:opacity-90 shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)' }}>
              Shop Now <FiArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20 overflow-hidden">
  <div className="text-center mb-10">
    <p className="text-xs font-medium mb-1 uppercase tracking-widest"
       style={{ color: 'var(--color-accent)' }}>What they say</p>
    <h2 className="text-3xl font-semibold"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
      Loved by customers
    </h2>
  </div>

  {/* Scroll container — no scrollbar, overflow hidden */}
  <div
    className="relative overflow-hidden"
    style={{
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }}
  >
    <div
      className="flex gap-5"
      style={{
        width: 'max-content',
        animation: 'testimonial-scroll 32s linear infinite',
      }}
      onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
      onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
    >
      {track.map(({ name, initial, review, rating }, i) => (
        <div
          key={`${name}-${i}`}
          className="rounded-2xl p-6 flex-shrink-0"
          style={{
            width: '300px',
            backgroundColor: 'var(--color-soft)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Stars rating={rating} />
          <p className="text-sm leading-relaxed my-4 italic"
             style={{ color: 'var(--color-muted)' }}>"{review}"</p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
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
  </div>

  {/* Keyframe — add once globally (index.css or a <style> tag) */}
  <style>{`
    @keyframes testimonial-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>
</section>

    </div>
  );
}