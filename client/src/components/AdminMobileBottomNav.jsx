import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiGrid, FiBox, FiShoppingCart, FiUsers,
  FiTag, FiPackage, FiHome, FiEye, FiMoreHorizontal, FiTruck, FiGift,
} from 'react-icons/fi';

const MAIN_LINKS = [
  { to: '/admin',          icon: FiGrid,         label: 'Home'     },
  { to: '/admin/products', icon: FiBox,          label: 'Products' },
  { to: '/admin/orders',   icon: FiShoppingCart, label: 'Orders'   },
  { to: '/admin/users',    icon: FiUsers,        label: 'Users'    },
];

const MORE_LINKS = [
  { to: '/admin/coupons',      icon: FiTag,     label: 'Coupons'       },
  { to: '/admin/returns',      icon: FiPackage, label: 'Returns'       },
  { to: '/admin/home-media',   icon: FiHome,    label: 'Home Media'    },
  { to: '/admin/delivery',     icon: FiTruck,   label: 'Delivery'      },
  { to: '/admin/combo-offers', icon: FiGift,    label: 'Combo Offers'  },
  { to: '/',                   icon: FiEye,     label: 'View Store'    },
];

export default function AdminMobileBottomNav() {
  const { pathname }    = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_LINKS.some(l => l.to !== '/' && pathname === l.to);

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl p-5"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.15)', borderTop: '2px solid var(--color-accent)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full mx-auto mb-5"
                 style={{ backgroundColor: 'var(--color-soft)' }} />
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <span style={{ width: '16px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
              <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
                More
              </p>
            </div>
            {MORE_LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 px-2 py-3 text-sm
                           transition-all active:opacity-70"
                style={{ color: 'var(--color-dark)', borderBottom: '1px solid var(--color-soft)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                     style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                  <Icon size={16} />
                </div>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-stretch"
        style={{
          borderColor: 'var(--color-soft)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MAIN_LINKS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="relative flex-1 flex flex-col items-center justify-center
                         gap-0.5 py-2.5 transition-colors"
              style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)' }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              )}
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6}
                    style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)', transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 150ms' }} />
              <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(v => !v)}
          className="relative flex-1 flex flex-col items-center justify-center
                     gap-0.5 py-2.5 border-none bg-transparent cursor-pointer transition-colors"
          style={{ color: showMore || isMoreActive ? 'var(--color-dark)' : 'var(--color-muted)' }}
        >
          {(showMore || isMoreActive) && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
          )}
          <FiMoreHorizontal size={20} strokeWidth={showMore || isMoreActive ? 2.2 : 1.6}
                             style={{ color: showMore || isMoreActive ? 'var(--color-accent)' : 'var(--color-muted)' }} />
          <span className="text-[10px] font-medium uppercase tracking-wide">More</span>
        </button>
      </nav>
    </>
  );
}