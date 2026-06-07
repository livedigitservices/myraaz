import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiLogOut, FiSettings, FiPackage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { userInfo, logout } = useAuth();
  const { totalItems }       = useCart();
  const { wishlist }         = useWishlist();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate     = useNavigate();
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

  /* ── Close dropdown on route change ── */
  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white sticky top-0 z-50"
         style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
               style={{ backgroundColor: 'var(--color-primary)' }}>
            {/* <span className="text-white text-xs font-bold">M</span> */}
            <img src="./raaz_favicon.svg" alt="" />
          </div>
          <span className="text-xl font-semibold uppercase"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
            my Raaz
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['/', '/products'].map((path, i) => (
            <Link key={path} to={path}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-muted)' }}>
              {['Home', 'Products'][i]}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3">

          {/* Wishlist */}
          <Link to="/wishlist" className="relative p-2 transition-colors"
                style={{ color: 'var(--color-muted)' }}>
            <FiHeart size={20} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-xs w-4 h-4
                               rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)', fontSize: '10px' }}>
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative p-2 transition-colors"
                style={{ color: 'var(--color-muted)' }}>
            <FiShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-xs w-4 h-4
                               rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)', fontSize: '10px' }}>
                {totalItems}
              </span>
            )}
          </Link>

          {/* User dropdown */}
          {userInfo ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full transition-colors"
                style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'var(--color-primary)' }}>
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl z-50 overflow-hidden"
                     style={{ boxShadow: 'var(--shadow-soft)',
                              border: '1px solid var(--color-soft)' }}>

                  {/* User info */}
                  <div className="px-4 py-3"
                       style={{ borderBottom: '1px solid var(--color-soft)' }}>
                    <p className="text-sm font-medium"
                       style={{ color: 'var(--color-dark)' }}>{userInfo.name}</p>
                    <p className="text-xs truncate"
                       style={{ color: 'var(--color-muted)' }}>
                      {userInfo.email || userInfo.phone || '—'}
                    </p>
                  </div>

                  {userInfo.isAdmin && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm
                                     transition-colors hover:bg-soft"
                          style={{ color: 'var(--color-dark)' }}>
                      <FiSettings size={15} /> Admin Dashboard
                    </Link>
                  )}

                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm
                                   transition-colors hover:bg-soft"
                        style={{ color: 'var(--color-dark)' }}>
                    <FiUser size={15} /> My Dashboard
                  </Link>

                  <Link to="/dashboard/orders" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm
                                   transition-colors hover:bg-soft"
                        style={{ color: 'var(--color-dark)' }}>
                    <FiPackage size={15} /> My Orders
                  </Link>

                  <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                     text-red-500 hover:bg-red-50 transition-colors">
                    <FiLogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden md:block">Login</Link>
          )}

          {/* Mobile toggle */}
          <button className="md:hidden p-2" style={{ color: 'var(--color-muted)' }}
                  onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white px-4 py-4 flex flex-col gap-3"
             style={{ borderTop: '1px solid var(--color-soft)' }}>
          <Link to="/"         onClick={() => setMenuOpen(false)}
                className="text-sm py-2" style={{ color: 'var(--color-dark)' }}>Home</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)}
                className="text-sm py-2" style={{ color: 'var(--color-dark)' }}>Products</Link>
          {!userInfo && (
            <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="btn-primary text-center">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}