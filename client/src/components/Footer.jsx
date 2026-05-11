import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-soft">
      <div className="max-w-6xl mx-auto px-4 py-12 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-serif text-xl text-dark font-semibold">myRaaz</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Premium beauty and personal care products crafted with natural ingredients for everyday wellness.
            </p>
            <div className="flex gap-4 mt-4">
               <a
    href="https://instagram.com/tharuntharun20"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    className="
      w-10 h-10 rounded-full
      flex items-center justify-center
      bg-white/10
      hover:bg-pink-500
      hover:text-white
      transition-all duration-300
      hover:scale-110
    "
  >
    <FiInstagram size={18} />
  </a>

  {/* Twitter / X */}
  <a
    href="https://twitter.com/myraaz"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Twitter"
    className="
      w-10 h-10 rounded-full
      flex items-center justify-center
      bg-white/10
      hover:bg-black
      hover:text-white
      transition-all duration-300
      hover:scale-110
    "
  >
    <FiTwitter size={18} />
  </a>

  {/* Facebook */}
  <a
    href="https://facebook.com/myraaz"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Facebook"
    className="
      w-10 h-10 rounded-full
      flex items-center justify-center
      bg-white/10
      hover:bg-blue-600
      hover:text-white
      transition-all duration-300
      hover:scale-110
    "
  >
    <FiFacebook size={18} />
  </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-dark mb-4">Shop</h4>
            <ul className="space-y-2">
              {['Hair Oils', 'Shampoos', 'Conditioners', 'Hair Masks', 'Serums'].map(item => (
                <li key={item}>
                  <Link to="/products" className="text-sm text-muted hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold text-dark mb-4">Help</h4>
            <ul className="space-y-2">
              {['About Us', 'Contact', 'Shipping Policy', 'Returns', 'FAQ'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-soft mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted">© {new Date().getFullYear()} myRaaz. All rights reserved.</p>
          <p className="text-xs text-muted">♥ Inspired by nature. Crafted for modern beauty.  </p>
        </div>
      </div>
    </footer>
  );
}