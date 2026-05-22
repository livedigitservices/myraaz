import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Stars = ({ rating = 0 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-3 h-3"
             fill={i < full ? 'var(--color-primary)' : i === full && half ? 'url(#half)' : 'none'}
             stroke="var(--color-primary)" strokeWidth="2">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="var(--color-primary)" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
};

const Skeleton = () => (
  <div className="relative flex items-center justify-center h-96 md:h-auto animate-pulse">
    <div className="absolute w-56 h-72 rounded-3xl rotate-6 opacity-40"
         style={{ backgroundColor: 'var(--color-secondary)' }} />
    <div className="absolute w-56 h-72 rounded-3xl -rotate-3 opacity-60"
         style={{ backgroundColor: 'var(--color-accent)' }} />
    <div className="relative w-60 rounded-3xl shadow-2xl"
         style={{ height: '304px', backgroundColor: 'var(--color-soft)' }} />
  </div>
);

const StaticFallback = () => (
  <div className="relative flex items-center justify-center h-96 md:h-auto">
    <div className="absolute w-56 h-72 rounded-3xl rotate-6 opacity-40"
         style={{ backgroundColor: 'var(--color-secondary)' }} />
    <div className="absolute w-56 h-72 rounded-3xl -rotate-3 opacity-60"
         style={{ backgroundColor: 'var(--color-accent)' }} />
    <div className="relative w-60 rounded-3xl overflow-hidden shadow-2xl"
         style={{ height: '304px', backgroundColor: 'var(--color-soft)' }}>
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-6xl">🌿</div>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: 'var(--color-dark)' }}>Argan Oil Elixir</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Best Seller</p>
        </div>
        <div className="w-full p-3 rounded-2xl text-center" style={{ backgroundColor: 'white' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>₹599</p>
        </div>
      </div>
    </div>
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
);

export default function HeroProduct() {
  const [product, setProduct] = useState(undefined); // undefined=loading, null=not set

  useEffect(() => {
    api.get('/home-featured')
      .then(({ data }) => setProduct(data))
      .catch(() => setProduct(null));
  }, []);

  if (product === undefined) return <Skeleton />;
  if (!product)              return <StaticFallback />;

  const image    = product.images?.[0];
  const price    = product.price;
  const sale     = product.salePrice;
  const rating   = product.rating   ?? 0;
  const reviews  = product.numReviews ?? 0;

  return (
    <div className="relative flex items-center justify-center h-96 md:h-auto">

      {/* Decorative blobs */}
      <div className="absolute w-56 h-72 rounded-3xl rotate-6 opacity-40"
           style={{ backgroundColor: 'var(--color-secondary)' }} />
      <div className="absolute w-56 h-72 rounded-3xl -rotate-3 opacity-60"
           style={{ backgroundColor: 'var(--color-accent)' }} />

      {/* Product card */}
      <Link
        to={`/products/${product._id}`}
        className="relative w-60 rounded-3xl overflow-hidden shadow-2xl block
                   transition-transform hover:scale-[1.02] duration-300"
        style={{ height: '304px', backgroundColor: 'var(--color-soft)' }}
      >
        {image ? (
          <>
            {/* Product image */}
            <img src={image} alt={product.name} className="w-full h-full object-cover" />

            {/* Best Seller badge */}
            {product.isBestSeller && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium"
                   style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                ⭐ Best Seller
              </div>
            )}

            {/* Name + price overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3"
                 style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
              <p className="text-white text-xs font-medium line-clamp-1">{product.name}</p>
              <p className="text-white text-sm font-semibold">
                ₹{sale ?? price}
                {sale && (
                  <span className="text-xs line-through ml-1 opacity-70">₹{price}</span>
                )}
              </p>
            </div>
          </>
        ) : (
          /* No-image fallback */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
            <div className="text-6xl">🌿</div>
            <div className="text-center">
              <p className="font-semibold text-sm line-clamp-2"
                 style={{ color: 'var(--color-dark)' }}>{product.name}</p>
              {product.isBestSeller && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Best Seller</p>
              )}
            </div>
            <div className="w-full p-3 rounded-2xl text-center" style={{ backgroundColor: 'white' }}>
              {sale ? (
                <div className="flex items-center justify-center gap-2">
                  <p className="font-semibold text-sm line-through"
                     style={{ color: 'var(--color-muted)' }}>₹{price}</p>
                  <p className="font-semibold text-sm"
                     style={{ color: 'var(--color-primary)' }}>₹{sale}</p>
                </div>
              ) : (
                <p className="font-semibold text-sm"
                   style={{ color: 'var(--color-primary)' }}>₹{price}</p>
              )}
            </div>
          </div>
        )}
      </Link>

      {/* Rating badge — top right */}
      {rating > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-2xl px-3 py-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <Stars rating={rating} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>
              {rating.toFixed(1)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews} reviews
          </p>
        </div>
      )}

      {/* Free delivery badge — bottom left */}
      <div className="absolute bottom-8 left-0 bg-white rounded-2xl px-3 py-2 shadow-lg">
        <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>🚚 Free delivery</p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Orders above ₹999</p>
      </div>

    </div>
  );
}