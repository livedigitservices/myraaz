import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiGrid, FiBox, FiShoppingCart, FiUsers,
  FiTag, FiPackage, FiHome, FiEye, FiMoreHorizontal,
} from 'react-icons/fi';

const MAIN_LINKS = [
  { to: '/admin',          icon: FiGrid,         label: 'Home'     },
  { to: '/admin/products', icon: FiBox,          label: 'Products' },
  { to: '/admin/orders',   icon: FiShoppingCart, label: 'Orders'   },
  { to: '/admin/users',    icon: FiUsers,        label: 'Users'    },
];

const MORE_LINKS = [
  { to: '/admin/coupons',    icon: FiTag,     label: 'Coupons'    },
  { to: '/admin/returns',    icon: FiPackage, label: 'Returns'    },
  { to: '/admin/home-media', icon: FiHome,    label: 'Home Media' },
  { to: '/',                 icon: FiEye,     label: 'View Store' },
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
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl p-4"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full mx-auto mb-4"
                 style={{ backgroundColor: 'var(--color-soft)' }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
               style={{ color: 'var(--color-muted)' }}>More</p>
            {MORE_LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                           transition-all active:opacity-70"
                style={{ color: 'var(--color-dark)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
                  <Icon size={17} />
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
              style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8}
                    style={{ transform: active ? 'scale(1.12)' : 'scale(1)', transition: 'transform 150ms' }} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(v => !v)}
          className="relative flex-1 flex flex-col items-center justify-center
                     gap-0.5 py-2.5 border-none bg-transparent cursor-pointer transition-colors"
          style={{ color: showMore || isMoreActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
        >
          {(showMore || isMoreActive) && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          )}
          <FiMoreHorizontal size={20} strokeWidth={showMore || isMoreActive ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}