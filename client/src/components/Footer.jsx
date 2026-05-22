import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

const HELP_LINKS = [
  { label: 'About Us',        to: '/about'           },
  { label: 'Contact',         to: '/contact'         },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Returns',         to: '/returns'         },
  { label: 'FAQ',             to: '/faq'             },
];

const SHOP_LINKS = [
  { label: 'Hair Oils',    to: '/products?category=hair-oils'    },
  { label: 'Shampoos',     to: '/products?category=shampoos'     },
  { label: 'Conditioners', to: '/products?category=conditioners' },
  { label: 'Hair Masks',   to: '/products?category=hair-masks'   },
  { label: 'Serums',       to: '/products?category=serums'       },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/tharuntharun20', Icon: FiInstagram },
  { label: 'Twitter',   href: 'https://twitter.com/myraaz',           Icon: FiTwitter  },
  { label: 'Facebook',  href: 'https://facebook.com/myraaz',          Icon: FiFacebook },
];

function SocialButton({ href, label, Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full flex items-center justify-center
                 bg-white/10 transition-all duration-300 hover:scale-110"
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = '';
      }}
    >
      <Icon size={18} />
    </a>
  );
}

function FooterNavColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-dark mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
              Premium beauty and personal care products crafted with natural
              ingredients for everyday wellness.
            </p>
            <div className="flex gap-4 mt-4">
              {SOCIAL_LINKS.map(s => (
                <SocialButton key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Shop */}
          <FooterNavColumn title="Shop" links={SHOP_LINKS} />

          {/* Help */}
          <FooterNavColumn title="Help" links={HELP_LINKS} />

        </div>

        <div className="border-t border-soft mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} myRaaz. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            ♥ Inspired by nature. Crafted for modern beauty.
          </p>
        </div>
      </div>
    </footer>
  );
}