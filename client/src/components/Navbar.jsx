import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiLogOut, FiSettings, FiPackage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

/* ── Nav link — hairline underline, always on when active, grows in on hover otherwise ── */
const NavLink = ({ to, children, active }) => (
  <Link to={to} className="group relative text-sm py-1 transition-colors"
        style={{ color: active ? 'var(--color-dark)' : 'var(--color-muted)' }}>
    {children}
    <span
      className={`absolute left-0 -bottom-0.5 h-px transition-all duration-300 ${active ? '' : 'w-0 group-hover:w-full'}`}
      style={{ width: active ? '100%' : undefined, backgroundColor: 'var(--color-accent)' }}
    />
  </Link>
);

/* ── Mobile menu link — staggered slide-in ── */
const MobileNavLink = ({ to, children, onClick, delay, borderBottom = true }) => (
  <Link
    to={to}
    onClick={onClick}
    className="mobile-link text-sm py-3.5 uppercase tracking-widest text-xs font-medium"
    style={{
      color: 'var(--color-dark)',
      borderBottom: borderBottom ? '1px solid var(--color-soft)' : 'none',
      transitionDelay: `${delay}ms`,
    }}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { userInfo, logout } = useAuth();
  const { totalItems }       = useCart();
  const { wishlist }         = useWishlist();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [menuMounted, setMenuMounted]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate     = useNavigate();
  const location     = useLocation();
  const dropdownRef  = useRef(null);

  /* ── Close dropdown when clicking outside ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  /* ── Close dropdown / menu on route change ── */
  useEffect(() => {
    setDropdownOpen(false);
    closeMenu();
  }, [navigate]);

  /* ── Mount/unmount mobile menu with animation ── */
  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const t = setTimeout(() => setMenuMounted(false), 350);
      return () => clearTimeout(t);
    }
  }, [menuOpen]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white sticky top-0 z-50"
         style={{ boxShadow: 'var(--shadow-card)', borderBottom: '1px solid var(--color-soft)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between ">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center p-1.5"
               >
            <img src="./raaz_favicon.svg" alt="myRaaz logo" className="w-full h-full object-contain rounded-2xl"
            style={{  backgroundColor:'var(--color-dark' }} />
          </div>
          <span className="text-xl tracking-wide uppercase"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            my Raaz
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <NavLink to="/" active={location.pathname === '/'}>
            Home
          </NavLink>
          <NavLink to="/products" active={location.pathname.startsWith('/products')}>
            Products
          </NavLink>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-1">

          {/* Wishlist */}
          <Link to="/wishlist" className="relative p-2.5 transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-dark)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
            <FiHeart size={19} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 text-white text-[10px] w-4 h-4
                               rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}>
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative p-2.5 transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-dark)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
            <FiShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 text-white text-[10px] w-4 h-4
                               rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-dark)' }}>
                {totalItems}
              </span>
            )}
          </Link>

          {/* User dropdown */}
          {userInfo ? (
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 transition-colors"
                style={{ border: '1px solid var(--color-soft)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'var(--color-dark)' }}>
                  <span className="text-white text-xs font-medium">
                    {userInfo.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium hidden md:block"
                      style={{ color: 'var(--color-dark)' }}>
                  {userInfo.name?.split(' ')[0]}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white z-50 overflow-hidden dropdown-pop"
                     style={{
                       boxShadow: 'var(--shadow-soft)',
                       borderLeft: '1px solid var(--color-soft)',
                       borderRight: '1px solid var(--color-soft)',
                       borderBottom: '1px solid var(--color-soft)',
                       borderTop: '2px solid var(--color-accent)',
                     }}>

                  {/* User info */}
                  <div className="px-4 py-3.5"
                       style={{ borderBottom: '1px solid var(--color-soft)' }}>
                    <p className="text-sm font-medium"
                       style={{ color: 'var(--color-dark)' }}>{userInfo.name}</p>
                    <p className="text-xs truncate mt-0.5"
                       style={{ color: 'var(--color-muted)' }}>
                      {userInfo.email || userInfo.phone || '—'}
                    </p>
                  </div>

                  {userInfo.isAdmin && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm
                                     transition-colors"
                          style={{ color: 'var(--color-dark)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-soft)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <FiSettings size={15} style={{ color: 'var(--color-accent)' }} /> Admin Dashboard
                    </Link>
                  )}

                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm
                                   transition-colors"
                        style={{ color: 'var(--color-dark)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-soft)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <FiUser size={15} style={{ color: 'var(--color-accent)' }} /> My Dashboard
                  </Link>

                  <Link to="/dashboard/orders" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm
                                   transition-colors"
                        style={{ color: 'var(--color-dark)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-soft)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <FiPackage size={15} style={{ color: 'var(--color-accent)' }} /> My Orders
                  </Link>

                  <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                     text-red-500 transition-colors"
                          style={{ borderTop: '1px solid var(--color-soft)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <FiLogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden md:flex items-center ml-3 px-6 py-2.5
                                          text-xs font-medium uppercase tracking-wider text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-dark)' }}>
              Login
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden relative p-2 ml-1 z-[60]"
            style={{ color: 'var(--color-dark)' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <FiMenu size={20} className={`burger-icon ${menuOpen ? 'burger-hide' : 'burger-show'}`} />
            <FiX    size={20} className={`burger-icon ${menuOpen ? 'burger-show' : 'burger-hide'}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu — absolute overlay, does NOT push page content */}
      {menuMounted && (
        <>
          {/* Backdrop */}
          <div
            className={`md:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
              menuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ top: '64px', zIndex: 40 }}
            onClick={closeMenu}
          />

          {/* Sliding panel */}
          <div
            className={`md:hidden absolute left-0 right-0 top-full bg-white overflow-hidden transition-all duration-300 ease-out ${
              menuOpen ? 'menu-open' : 'menu-closed'
            }`}
            style={{
              zIndex: 50,
              borderTop: '1px solid var(--color-soft)',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div className="px-4 py-5 flex flex-col gap-1">
              <MobileNavLink to="/" onClick={closeMenu} delay={menuOpen ? 60 : 0}>
                Home
              </MobileNavLink>
              <MobileNavLink
                to="/products"
                onClick={closeMenu}
                delay={menuOpen ? 110 : 0}
                borderBottom={!!userInfo}
              >
                Products
              </MobileNavLink>
              {!userInfo && (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="mobile-link mt-4 text-center py-3 text-xs font-medium uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'var(--color-dark)', transitionDelay: menuOpen ? '160ms' : '0ms' }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .burger-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(0deg) scale(1);
          opacity: 1;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
        }
        .burger-hide {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(-90deg) scale(0.5);
        }
        .burger-show {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(0deg) scale(1);
        }

        .menu-closed {
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px);
        }
        .menu-open {
          max-height: 420px;
          opacity: 1;
          transform: translateY(0);
        }

        .mobile-link {
          opacity: 0;
          transform: translateX(-12px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .menu-open .mobile-link {
          opacity: 1;
          transform: translateX(0);
        }

        .dropdown-pop {
          animation: dropdownPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropdownPop {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </nav>
  );
}