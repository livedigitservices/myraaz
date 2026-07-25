import { Link, useLocation } from 'react-router-dom';
import {
  FiUser, FiPackage, FiCreditCard, FiHeart, FiShoppingCart,
} from 'react-icons/fi';
import { useCart }     from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const NAV_ITEMS = [
  { to: '/dashboard',        icon: FiUser,         label: 'Account'  },
  { to: '/dashboard/orders', icon: FiPackage,      label: 'Orders'   },
  { to: '/dashboard/wallet', icon: FiCreditCard,   label: 'Wallet'   },
  { to: '/wishlist',         icon: FiHeart,        label: 'Wishlist' },
  { to: '/cart',             icon: FiShoppingCart, label: 'Cart'     },
];

export default function MobileBottomNav() {
  const { pathname }  = useLocation();
  const { totalItems } = useCart();
  const { wishlist }   = useWishlist();

  const badges = {
    '/cart':    totalItems   || 0,
    '/wishlist': wishlist?.length || 0,
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white flex items-stretch border-t"
      style={{
        borderColor: 'var(--color-soft)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const active  = pathname === to;
        const badge   = badges[to];

        return (
          <Link
            key={to}
            to={to}
            className="relative flex flex-col items-center justify-center gap-0.5
                       flex-1 py-2.5 transition-all duration-150"
            style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)' }}
          >
            {/* Active hairline indicator */}
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
            )}

            {/* Icon wrapper */}
            <span className="relative">
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                  transition: 'transform 150ms',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                }}
              />
              {/* Badge */}
              {badge > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1
                             rounded-full text-[9px] font-bold text-white
                             flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-dark)' }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>

            <span
              className="text-[10px] leading-none uppercase tracking-wide"
              style={{ fontWeight: active ? 600 : 400 }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}