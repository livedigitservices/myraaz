import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCreditCard, FiArrowUp, FiArrowDown,
  FiPackage, FiHeart, FiShoppingCart,
  FiBox, FiEdit2, FiUser, FiRefreshCw,
} from 'react-icons/fi';
import api       from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color:           active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

const TXN_LABELS = {
  credit: { bg: '#D1FAE5', color: '#059669', icon: <FiArrowDown size={16} className="text-green-500" />, sign: '+' },
  debit:  { bg: '#FEE2E2', color: '#DC2626', icon: <FiArrowUp   size={16} className="text-red-500"   />, sign: '-' },
};

export default function Wallet() {
  const { userInfo }          = useAuth();
  const [wallet, setWallet]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchWallet = () => {
    setLoading(true);
    setError(false);
    api.get('/wallet')              // ✅ correct endpoint
      .then(({ data }) => setWallet(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWallet(); }, []);

  /* ── Derived stats ── */
  const totalCredits = wallet?.transactions
    ?.filter(t => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0) ?? 0;

  const totalDebits = wallet?.transactions
    ?.filter(t => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0) ?? 0;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col items-center px-4 mb-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center
                          text-xl font-bold text-white mb-2"
               style={{ backgroundColor: 'var(--color-primary)' }}>
            {userInfo?.name?.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
            {userInfo?.name}
          </p>
        </div>
        <SideLink to="/dashboard"          icon={<FiUser size={16} />}       label="Overview"      />
        <SideLink to="/dashboard/orders"   icon={<FiPackage size={16} />}    label="My Orders"     />
        <SideLink to="/dashboard/wallet"   icon={<FiCreditCard size={16} />} label="Wallet" active />
        <SideLink to="/dashboard/profile"  icon={<FiEdit2 size={16} />}      label="Edit Profile"  />
        <SideLink to="/wishlist"           icon={<FiHeart size={16} />}      label="Wishlist"      />
        <SideLink to="/cart"               icon={<FiShoppingCart size={16} />} label="Cart"        />
        <SideLink to="/products"           icon={<FiBox size={16} />}        label="Shop"          />
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 p-4 sm:p-6 min-w-0 max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              My Wallet
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Refunds and store credits
            </p>
          </div>
          <button onClick={fetchWallet} disabled={loading}
            className="p-2 rounded-xl transition-all hover:bg-soft disabled:opacity-50"
            style={{ color: 'var(--color-muted)' }}
            title="Refresh">
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 animate-pulse"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-6 w-40 rounded-full mx-auto"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
              </div>
            ))}
          </div>

        ) : error ? (
          <div className="bg-white rounded-2xl p-10 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
              Failed to load wallet
            </p>
            <button onClick={fetchWallet}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Try Again
            </button>
          </div>

        ) : (
          <div className="space-y-5">

            {/* ── Balance card ── */}
            <div className="rounded-3xl p-8 text-center relative overflow-hidden"
                 style={{ backgroundColor: 'var(--color-primary)' }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-white" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 bg-white" />
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">
                Available Balance
              </p>
              <p className="text-5xl font-semibold text-white relative z-10"
                 style={{ fontFamily: 'var(--font-serif)' }}>
                ₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-white/60 text-xs mt-2">
                Use at checkout · Instant payment
              </p>
            </div>

            {/* ── Stats strip ── */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Credited', value: `₹${totalCredits.toLocaleString('en-IN')}`, color: '#059669' },
                { label: 'Total Spent',    value: `₹${totalDebits.toLocaleString('en-IN')}`,  color: '#DC2626' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 text-center"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color }}>
                    {value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Transactions ── */}
            <div className="bg-white rounded-2xl overflow-hidden"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-5 py-4 flex items-center justify-between"
                   style={{ borderBottom: '1px solid var(--color-soft)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                  Transaction History
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                  {wallet?.transactions?.length ?? 0} transactions
                </span>
              </div>

              {!wallet?.transactions?.length ? (
                <div className="py-16 text-center">
                  <FiCreditCard size={32} style={{ color: 'var(--color-muted)' }}
                                className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    No transactions yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Refunds and payments will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-soft)' }}>
                  {wallet.transactions.map((txn, i) => {
                    const style = TXN_LABELS[txn.type] || TXN_LABELS.debit;
                    return (
                      <div key={txn._id || i} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-full flex items-center
                                        justify-center shrink-0"
                             style={{ backgroundColor: style.bg }}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1"
                             style={{ color: 'var(--color-dark)' }}>
                            {txn.description}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                          {txn.status && txn.status !== 'completed' && (
                            <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                                  style={{
                                    backgroundColor: txn.status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                                    color:           txn.status === 'failed' ? '#DC2626' : '#D97706',
                                  }}>
                              {txn.status}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-semibold shrink-0"
                           style={{
                             fontFamily: 'var(--font-serif)',
                             color:      style.color,
                           }}>
                          {style.sign}₹{txn.amount?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── How it works ── */}
            <div className="bg-white rounded-2xl p-5"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-dark)' }}>How wallet works</h3>
              <div className="space-y-2">
                {[
                  '💰 Refunds from returned orders are credited here instantly',
                  '🛒 Use your balance at checkout by selecting "myRaaz Wallet"',
                  '✅ Wallet payments are instant — no OTP or gateway needed',
                  '↩️ Cancelled orders are automatically refunded to your wallet',
                ].map(tip => (
                  <p key={tip} className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {tip}
                  </p>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}