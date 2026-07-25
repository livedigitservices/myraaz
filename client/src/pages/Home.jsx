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

/* ── Testimonials data (module scope — created once, not per-render) ── */
const testimonials = [
  { name: 'Priya S.',   photo: 'https://images.unsplash.com/photo-1496813146940-1601b02f81a4?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: "The argan oil completely transformed my dry, frizzy hair in just 2 weeks. I genuinely can't live without it now!", rating: 4 },
  { name: 'Ananya M.',  photo: 'https://images.unsplash.com/photo-1558377235-802c801ab268?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: "Best shampoo I've ever used. My scalp feels so clean and fresh, and my hair has never looked this shiny before.", rating: 4 },
  { name: 'Kavitha R.', photo: 'https://images.unsplash.com/photo-1533128361669-69c065857a13?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: 'The hair mask is absolutely luxurious. My hair feels so soft and the smell is incredible. Totally worth every rupee!', rating: 5 },
  { name: 'Meera T.',   photo: 'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: 'The serum gave my hair an incredible shine after just one use. So lightweight and absolutely no greasiness at all!', rating: 5 },
  { name: 'Divya L.',   photo: 'https://images.unsplash.com/photo-1463335361701-e90f4c5045d0?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: 'Finally found a conditioner that actually detangles without weighing my hair down. My morning routine is so much easier.', rating: 4 },
  { name: 'Sneha R.',   photo: 'https://images.unsplash.com/photo-1573165850883-9b0e18c44bd2?auto=format&fit=crop&crop=faces&w=200&h=200&q=80', review: 'The hair mask smells divine and my curls have never looked this defined. Will definitely be repurchasing very soon!', rating: 5 },
];

// Duplicate for seamless infinite loop
const track = [...testimonials, ...testimonials];

/* ── Product card — boutique hover reveal ── */
const ProductCard = ({ product }) => {
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
      {/* ── Image Section ── */}
      <div className="relative overflow-hidden aspect-square" style={{ backgroundColor: 'var(--color-soft)' }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Wishlist Button */}
        <button
          onClick={() => {
            if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
            else            { addToWishlist(product);          toast.success('Added to wishlist 💛'); }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center
                     justify-center transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
        >
          <FiHeart
            size={13}
            fill={wishlisted ? 'var(--color-accent)' : 'none'}
            color={wishlisted ? 'var(--color-accent)' : 'var(--color-muted)'}
          />
        </button>

        {/* Category label — plain text, not a pill */}
        <span
          className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-[0.15em] capitalize"
          style={{ color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}
        >
          {product.category}
        </span>

        {/* Slide-up add-to-cart bar, revealed on hover */}
        <button
          onClick={() => { addToCart(product); toast.success('Added to cart 🛒'); }}
          className="absolute left-0 right-0 bottom-0 flex items-center justify-center gap-2 py-3
                     text-xs font-medium uppercase tracking-wider text-white
                     translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out"
          style={{ backgroundColor: 'var(--color-dark)' }}
        >
          <FiShoppingCart size={12} /> Add to Cart
        </button>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4">
        <p className="text-[11px] mb-1 tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold mb-2 line-clamp-2 leading-snug" style={{ color: 'var(--color-dark)' }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.rating} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>({product.numReviews})</span>
        </div>
        <span className="text-lg font-semibold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
          ₹{product.price}
        </span>
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

  const categoryImages = {
    'hair-oil':    'https://images.unsplash.com/photo-1699373383871-4ca5636948c1',
    'shampoo':     'https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0',
    'conditioner': 'https://images.unsplash.com/photo-1711985220413-50865dc0bb4f',
    'hair-mask':   'https://images.unsplash.com/photo-1711985220370-07ead417d683',
    'serum':       'https://images.unsplash.com/photo-1711985220300-3a51676e466e',
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
      <section className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 overflow-hidden">
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            {/* Eyebrow — matches perks/testimonials treatment */}
            <div className="flex items-center gap-3 mb-6">
              <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
              <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>
                100% Natural Ingredients
              </p>
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Elevate Your
              <span className="block" style={{ color: 'var(--color-primary)' }}>Beauty Routine</span>
            </h1>

            <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: 'var(--color-muted)' }}>
              Discover premium beauty and cosmetic essentials crafted to enhance your
              everyday self-care — from skincare and haircare to beauty products you'll love ♥.
            </p>

            <div className="flex items-center gap-8 flex-wrap mb-12">
              <Link to="/products"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                               font-medium text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                Shop Now <FiArrowRight size={15} />
              </Link>
              <Link to="/products"
                    className="flex items-center gap-1.5 text-sm font-medium border-b pb-0.5 transition-all hover:gap-2.5"
                    style={{ color: 'var(--color-dark)', borderColor: 'var(--color-dark)' }}>
                View All <FiArrowRight size={13} />
              </Link>
            </div>

            {/* Stats — hairline-divided, no boxes */}
            <div className="flex items-center gap-0">
              {[['10K+', 'Happy customers'], ['50+', 'Products'], ['100%', 'Natural']].map(([num, label], i) => (
                <div key={label}
                     className={i !== 0 ? 'pl-8 ml-8 border-l' : ''}
                     style={i !== 0 ? { borderColor: 'var(--color-soft)' } : {}}>
                  <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                    {num}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product showcase, framed like a display case */}
          <div className="relative">
            {/* Soft color halo behind the frame */}
            <div className="absolute -inset-6 rounded-full blur-3xl opacity-20 hidden md:block"
                 style={{ backgroundColor: 'var(--color-accent)' }} />

            {/* Hairline frame */}
            <div className="relative" style={{ border: '1px solid var(--color-soft)', padding: '6px' }}>
              <HeroProduct />
            </div>

            {/* Seal badge */}
            <div className="absolute -top-4 -left-4 z-10 hidden md:flex items-center justify-center
                             w-20 h-20 rounded-full text-center"
                 style={{ backgroundColor: 'var(--color-dark)', border: '1px solid var(--color-accent)' }}>
              <span className="text-[9px] font-medium uppercase tracking-widest leading-tight" style={{ color: 'var(--color-accent)' }}>
                100%<br />Natural
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERKS / PROMISE BAND ── */}
      <section className="relative py-16 md:py-20 overflow-hidden" style={{ backgroundColor: 'var(--color-dark)' }}>
        {/* Ambient background texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1600&q=60)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 0%, var(--color-dark) 85%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4">
          {/* Eyebrow + heading */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
              <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>
                Our Promise
              </p>
              <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
              Crafted With Care, Delivered With Trust
            </h2>
          </div>

          {/* Perks grid — hairline dividers instead of boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4">
            {perks.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className={`group relative flex flex-col items-center text-center px-6 py-8
                            ${i % 2 !== 0 ? 'border-l border-white/10' : ''}
                            ${i >= 2 ? 'border-t border-white/10 md:border-t-0' : ''}
                            ${i !== 0 ? 'md:border-l md:border-white/10' : ''}`}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/[0.06]"
                  style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
                >
                  {icon}
                </div>
                <p className="text-white text-sm font-medium tracking-wide mb-1">{title}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)'}} />
              <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
                The Collection
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Shop by Category
            </h2>
          </div>
          <Link to="/products"
                className="hidden sm:flex items-center gap-1.5 text-sm hover:gap-2.5 transition-all"
                style={{ color: 'var(--color-primary)' }}>
            View all <FiArrowRight size={14} />
          </Link>
        </div>

        {/* Bento gallery — desktop / tablet */}
        <div className="hidden sm:grid grid-cols-4 gap-4" style={{ gridAutoRows: '170px', gridAutoFlow: 'dense' }}>
          {categories.map(({ name, slug, desc }, i) => (
            <Link
              key={slug}
              to={`/products?category=${slug}`}
              className={`group relative overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : 'col-span-2 md:col-span-1 row-span-1'}`}
              style={{ borderRadius: '4px', boxShadow: 'var(--shadow-card)' }}
            >
              {/* Photo */}
              <img
                src={`${categoryImages[slug]}?auto=format&fit=crop&w=900&q=80`}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />

              {/* Bottom gradient for text legibility */}
              <div className="absolute inset-0"
                   style={{ background: 'linear-gradient(180deg, rgba(26,46,26,0) 40%, rgba(12,20,12,0.88) 100%)' }} />

              {/* Gold frame — reveals on hover */}
              <div className="absolute inset-3 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                   style={{ border: '1px solid rgba(217,184,114,0.75)', borderRadius: '2px' }} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                <span className="block mb-2 transition-all duration-500 group-hover:w-10"
                      style={{ width: '18px', height: '1px', backgroundColor: '#D9B872' }} />
                <h3 className={`font-semibold text-white leading-tight ${i === 0 ? 'text-2xl md:text-3xl mb-1.5' : 'text-base md:text-lg mb-1'}`}
                    style={{ fontFamily: 'var(--font-serif)' }}>
                  {name}
                </h3>
                {i === 0 && (
                  <p className="text-sm text-white/75 mb-3 max-w-[220px]">{desc}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs font-medium transition-all duration-300 opacity-0 -translate-x-1 group-hover:opacity-90 group-hover:translate-x-0"
                     style={{ color: 'white' }}>
                  Explore <FiArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Horizontal snap gallery — mobile */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollSnapType: 'x mandatory' }}>
          {categories.map(({ name, slug, desc }) => (
            <Link
              key={slug}
              to={`/products?category=${slug}`}
              className="relative shrink-0 overflow-hidden"
              style={{ width: '68vw', height: '280px', scrollSnapAlign: 'start', borderRadius: '4px', boxShadow: 'var(--shadow-card)' }}
            >
              <img src={`${categoryImages[slug]}?auto=format&fit=crop&w=700&q=80`} alt={name}
                   className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0"
                   style={{ background: 'linear-gradient(180deg, rgba(26,46,26,0) 40%, rgba(12,20,12,0.88) 100%)' }} />
              <div className="absolute inset-3 pointer-events-none"
                   style={{ border: '1px solid rgba(217,184,114,0.5)', borderRadius: '2px' }} />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <span className="block mb-2" style={{ width: '18px', height: '1px', backgroundColor: '#D9B872' }} />
                <h3 className="text-xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                  {name}
                </h3>
                <p className="text-xs text-white/75">{desc}</p>
              </div>
            </Link>
          ))}
          <Link to="/products"
                className="sm:hidden shrink-0 flex items-center gap-1.5 text-sm px-1"
                style={{ color: 'var(--color-primary)', scrollSnapAlign: 'start' }}>
            View all <FiArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="mt-10 max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
              <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>
                Hand Picked
              </p>
            </div>
            <h2 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
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
              <div key={i} className="bg-white overflow-hidden animate-pulse">
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
      <section className="max-w-6xl mx-auto px-4 pb-24 overflow-hidden">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
            <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>
              What They Say
            </p>
            <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Loved by Customers
          </h2>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div
            className="flex gap-6"
            style={{ width: 'max-content', animation: 'testimonial-scroll 42s linear infinite' }}
            onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
          >
            {track.map(({ name, photo, review, rating }, i) => (
              <div
                key={`${name}-${i}`}
                className="relative flex-shrink-0 p-8"
                style={{
                  width: '340px',
                  backgroundColor: '#FFFFFF',
                  borderTop: '2px solid var(--color-accent)',
                  boxShadow: '0 24px 48px -24px rgba(26,46,26,0.25)',
                }}
              >
                {/* Watermark quote mark */}
                <span
                  className="absolute top-3 right-6 leading-none select-none pointer-events-none"
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '72px', color: 'var(--color-soft)' }}
                >
                  "
                </span>

                <Stars rating={rating} />

                <p
                  className="text-[15px] leading-relaxed my-5 relative z-10"
                  style={{ color: 'var(--color-dark)', fontFamily: 'var(--font-serif)' }}
                >
                  {review}
                </p>

                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--color-soft)' }}>
                  <img
                    src={photo}
                    alt={name}
                    className="w-11 h-11 rounded-full object-cover"
                    style={{ border: '1.5px solid var(--color-accent)' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>{name}</p>
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                      Verified Buyer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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