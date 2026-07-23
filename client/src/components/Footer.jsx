import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiMapPin, FiArrowUpRight } from 'react-icons/fi';

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
  { label: 'Instagram', href: 'https://www.instagram.com/myraazofficial2/',                          Icon: FiInstagram },
  { label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61592214005156',               Icon: FiFacebook  },
  { label: 'Gmail',     href: 'https://mail.google.com/mail/?view=cm&fs=1&to=myraazofficial@gmail.com', Icon: FiMail,   isMail: true },
  { label: 'Maps',      href: 'https://maps.app.goo.gl/vdmw3oU3aLGNdriZ8',                             Icon: FiMapPin    },
];

/* ── Social button — outlined gold, fills on hover ── */
function SocialButton({ href, label, Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{ border: '1px solid rgba(217,184,114,0.4)', color: 'var(--color-accent)' }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-accent)';
        e.currentTarget.style.borderColor = 'var(--color-accent)';
        e.currentTarget.style.color = 'var(--color-dark)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'rgba(217,184,114,0.4)';
        e.currentTarget.style.color = 'var(--color-accent)';
      }}
    >
      <Icon size={16} />
    </a>
  );
}

/* ── Nav column — understated, hover reveals a gold underline ── */
function FooterNavColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] mb-5" style={{ color: 'var(--color-accent)' }}>
        {title}
      </p>
      <ul className="space-y-3">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="group inline-flex items-center gap-1.5 text-sm transition-colors duration-300"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
            >
              <span
                className="block h-px w-0 group-hover:w-3 transition-all duration-300"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
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
    <footer className="relative overflow-hidden" style={{ backgroundColor: 'var(--color-dark)' }}>
      {/* Ambient texture — same device used in the Perks band, kept faint */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=1600&q=60)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at top, transparent 0%, var(--color-dark) 75%)' }}
      />
      {/* Hairline top edge */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">

        {/* ── Top: brand statement + nav columns ── */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12 pb-16">

          {/* Brand block */}
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 p-2"
                style={{ border: '1px solid var(--color-accent)' }}
              >
                <img src="/raaz_favicon.svg" alt="myRaaz logo" className="w-full h-full object-contain" />
              </div>
              <span
                className="text-2xl tracking-wide"
                style={{ fontFamily: 'var(--font-serif)', color: 'white' }}
              >
                my Raaz
              </span>
            </div>

            <p className="text-sm leading-relaxed max-w-xs mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Premium beauty and personal care essentials, crafted with natural
              ingredients for a quieter, more considered kind of self-care.
            </p>

            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(s => (
                <SocialButton key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Spacer column on desktop for breathing room */}
          <div className="hidden md:block md:col-span-1" />

          {/* Shop */}
          <div className="col-span-1 md:col-span-3">
            <FooterNavColumn title="Shop" links={SHOP_LINKS} />
          </div>

          {/* Help */}
          <div className="col-span-1 md:col-span-3">
            <FooterNavColumn title="Help" links={HELP_LINKS} />
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-8 text-center sm:text-left"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} myRaaz. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            <p className="text-xs uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Inspired by nature, crafted for modern beauty
            </p>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
          </div>
        </div>

      </div>
    </footer>
  );
}