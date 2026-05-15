import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiCheck, FiX, FiChevronDown,
  FiChevronUp, FiTrendingUp, FiBox,
  FiShoppingCart, FiUsers, FiTag, FiEye
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

const ReturnBadge = ({ status }) => {
  const map = {
    pending:          { bg: '#FEF3C7', color: '#D97706', label: '⏳ Pending'           },
    approved:         { bg: '#D1FAE5', color: '#059669', label: '✓ Approved'           },
    rejected:         { bg: '#FEE2E2', color: '#DC2626', label: '✗ Rejected'           },
    refund_initiated: { bg: '#DBEAFE', color: '#2563EB', label: '🔄 Refund Processing' },
    refund_completed: { bg: '#D1FAE5', color: '#059669', label: '✅ Refund Completed'  },
    refund_failed:    { bg: '#FEE2E2', color: '#DC2626', label: '❌ Refund Failed'     },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

/* ── Helper: get status from a return object ──────────────────────────────
   The backend reshapes returns so status lives at returnRequest.status.
   We centralise this so every filter/badge reads from the same place.
───────────────────────────────────────────────────────────────────────── */
const getStatus = (ret) => ret?.returnRequest?.status || ret?.status || 'pending';

export default function AdminReturns() {
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes]       = useState({});
  const [acting, setActing]     = useState(null);

  useEffect(() => {
    const loadReturns = async () => {
      try {
        const { data } = await api.get('/returns/admin');
        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data?.returns)
            ? data.returns
            : [];
        setReturns(raw);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load returns');
      } finally {
        setLoading(false);
      }
    };
    loadReturns();
  }, []);

  /* ── Approve / Reject ── */
  const handleAction = async (returnId, status) => {
    try {
      setActing(returnId + status);
      const { data } = await api.put(`/returns/admin/${returnId}`, {
        status,
        adminNote: notes[returnId] || '',
      });

      /* Re-fetch all returns so the reshaped data stays consistent */
      const { data: refreshed } = await api.get('/returns/admin');
      const raw = Array.isArray(refreshed)
        ? refreshed
        : Array.isArray(refreshed?.returns)
          ? refreshed.returns
          : [];
      setReturns(raw);

      toast.success(data?.message || `Return ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setActing(null);
    }
  };

  /* ── Filter — use getStatus() consistently ── */
  const filtered = filter === 'all'
    ? returns
    : returns.filter(r => getStatus(r) === filter);

  const countFor = (key) =>
    key === 'all'
      ? returns.length
      : returns.filter(r => getStatus(r) === key).length;

  const pendingCount = countFor('pending');

  /* ── Refund info text ── */
  const getRefundInfo = (ret) => {
    const pm = ret.paymentMethod;
    if (pm === 'Razorpay')
      return '💳 Razorpay will automatically refund to their original UPI/Card/Netbanking. No manual action needed. (5-7 days)';
    if (pm === 'Stripe')
      return '🌍 Stripe will automatically refund to their original card. No manual action needed. (5-10 days)';
    if (pm === 'Wallet')
      return '👛 Amount will be credited back to their myRaaz wallet instantly.';
    if (pm === 'COD') {
      if (ret.refundMethod === 'upi')
        return `💸 ₹${ret.refundAmount} will be sent to UPI: ${ret.upiId}`;
      if (ret.refundMethod === 'bank')
        return '🏦 Manual bank transfer required. See bank details below.';
      return '👛 Amount will be credited to their myRaaz wallet.';
    }
    return '👛 Amount will be credited to their myRaaz wallet.';
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}   label="Dashboard"       />
        <SideLink to="/admin/products" icon={<FiBox size={16} />}          label="Products"        />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />} label="Orders"          />
        <SideLink to="/admin/returns"  icon={<FiPackage size={16} />}      label="Returns" active  />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}        label="Users"           />
        <SideLink to="/admin/coupons"  icon={<FiTag size={16} />}          label="Coupons"         />
        <div className="mt-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                Return Requests
              </h1>
              {pendingCount > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: '#D97706' }}>
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {returns.length} total requests
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: 'pending',          label: 'Pending'   },
            { key: 'refund_completed', label: 'Completed' },
            { key: 'rejected',         label: 'Rejected'  },
            { key: 'refund_failed',    label: 'Failed'    },
            { key: 'all',              label: 'All'       },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0"
              style={{
                backgroundColor: filter === key ? 'var(--color-primary)' : 'var(--color-soft)',
                color: filter === key ? 'white' : 'var(--color-muted)',
              }}>
              {label} ({countFor(key)})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-4 w-32 rounded-full mb-3"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
                <div className="h-3 w-full rounded-full"
                     style={{ backgroundColor: 'var(--color-soft)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <FiPackage size={36} style={{ color: 'var(--color-muted)' }}
                       className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
              No {filter === 'all' ? '' : filter} return requests
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(ret => {
              const status     = getStatus(ret);
              const isExpanded = expanded === ret._id;
              const isPending  = status === 'pending';

              return (
                <div key={ret._id} className="bg-white rounded-2xl overflow-hidden"
                     style={{ boxShadow: 'var(--shadow-card)' }}>

                  {/* Card header */}
                  <div className="flex items-center justify-between p-5 cursor-pointer
                                  hover:bg-soft/30 transition-colors gap-4"
                       onClick={() => setExpanded(isExpanded ? null : ret._id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnails */}
                      <div className="flex -space-x-2 shrink-0">
                        {(ret.orderItems || ret.returnItems || []).slice(0, 2).map((item, i) => (
                          <div key={i} className="w-11 h-11 rounded-xl overflow-hidden
                                                   border-2 border-white"
                               style={{ backgroundColor: 'var(--color-soft)' }}>
                            {item.image
                              ? <img src={item.image} alt={item.name}
                                     className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">
                                  <FiPackage size={14} style={{ color: 'var(--color-muted)' }} />
                                </div>
                            }
                          </div>
                        ))}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-xs font-semibold"
                                style={{ color: 'var(--color-dark)' }}>
                            #{ret._id.slice(-8).toUpperCase()}
                          </span>
                          <ReturnBadge status={status} />
                          {ret.requiresManualReview && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              ⚠️ Review
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate"
                           style={{ color: 'var(--color-dark)' }}>
                          {ret.user?.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                          {ret.user?.email || ret.user?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-semibold"
                           style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                          ₹{ret.refundAmount?.toLocaleString('en-IN') || '—'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {ret.returnRequest?.requestedAt
                            ? new Date(ret.returnRequest.requestedAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                      {isExpanded
                        ? <FiChevronUp size={16} style={{ color: 'var(--color-muted)' }} />
                        : <FiChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4"
                         style={{ borderTop: '1px solid var(--color-soft)' }}>

                      {/* Return reason */}
                      <div className="pt-3">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--color-muted)' }}>Return Reason</p>
                        <p className="text-sm font-medium"
                           style={{ color: 'var(--color-dark)' }}>
                          {ret.returnRequest?.reason || '—'}
                        </p>
                      </div>

                      {/* Returnable items */}
                      {ret.returnRequest?.returnableItems?.length > 0 && (
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            ✓ Items Being Returned
                          </p>
                          {ret.returnRequest.returnableItems.map((name, i) => (
                            <p key={i} className="text-xs text-green-700">• {name}</p>
                          ))}
                        </div>
                      )}

                      {/* Non-returnable items */}
                      {ret.returnRequest?.nonReturnableItems?.length > 0 && (
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEF2F2' }}>
                          <p className="text-xs font-semibold text-red-600 mb-1">
                            ✗ Non-returnable Items
                          </p>
                          {ret.returnRequest.nonReturnableItems.map((name, i) => (
                            <p key={i} className="text-xs text-red-500">• {name}</p>
                          ))}
                        </div>
                      )}

                      {/* Order items */}
                      {ret.orderItems?.length > 0 && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                             style={{ color: 'var(--color-muted)' }}>Order Items</p>
                          {ret.orderItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white">
                                {item.image
                                  ? <img src={item.image} className="w-full h-full object-cover" />
                                  : <FiBox size={14} className="m-auto mt-2"
                                           style={{ color: 'var(--color-muted)' }} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-1"
                                   style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                  Qty: {item.quantity} · ₹{item.price}
                                </p>
                              </div>
                              <p className="text-xs font-semibold shrink-0"
                                 style={{ color: 'var(--color-primary)' }}>
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Refund info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl text-center"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            Refund Amount
                          </p>
                          <p className="text-lg font-semibold"
                             style={{ fontFamily: 'var(--font-serif)',
                                      color: 'var(--color-primary)' }}>
                            ₹{ret.refundAmount?.toLocaleString('en-IN') || '—'}
                          </p>
                          {ret.partialRefund && (
                            <p className="text-xs text-amber-600">Partial Refund</p>
                          )}
                        </div>
                        <div className="p-3 rounded-xl text-center"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            Payment Method
                          </p>
                          <p className="text-sm font-semibold capitalize"
                             style={{ color: 'var(--color-dark)' }}>
                            {ret.paymentMethod || '—'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            via {ret.refundMethod || 'wallet'}
                          </p>
                        </div>
                      </div>

                      {/* Customer address */}
                      {ret.shippingAddress && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                             style={{ color: 'var(--color-muted)' }}>Customer Address</p>
                          <p className="text-sm font-medium"
                             style={{ color: 'var(--color-dark)' }}>
                            {ret.shippingAddress?.fullName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            📱 {ret.shippingAddress?.phone}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {ret.shippingAddress?.address}, {ret.shippingAddress?.city},{' '}
                            {ret.shippingAddress?.state} — {ret.shippingAddress?.pincode}
                          </p>
                        </div>
                      )}

                      {/* Fraud flags */}
                      {ret.requiresManualReview && ret.fraudFlags?.length > 0 && (
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7' }}>
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            ⚠️ Fraud Flags — Manual Review Required
                          </p>
                          {ret.fraudFlags.map((flag, i) => (
                            <p key={i} className="text-xs text-amber-600">
                              • {flag.reason}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* COD bank details */}
                      {ret.paymentMethod === 'COD' && ret.bankDetails?.accountNumber && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                             style={{ color: 'var(--color-muted)' }}>Bank Details for Refund</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                            {ret.bankDetails.accountName}
                          </p>
                          <p className="text-xs font-mono mt-0.5"
                             style={{ color: 'var(--color-muted)' }}>
                            Account: {ret.bankDetails.accountNumber}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            IFSC: {ret.bankDetails.ifsc}
                          </p>
                        </div>
                      )}

                      {/* COD UPI */}
                      {ret.paymentMethod === 'COD' && ret.upiId && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                             style={{ color: 'var(--color-muted)' }}>UPI ID for Refund</p>
                          <p className="text-sm font-mono font-medium"
                             style={{ color: 'var(--color-dark)' }}>{ret.upiId}</p>
                        </div>
                      )}

                      {/* ── PENDING ACTIONS ── */}
                      {isPending && (
                        <div className="space-y-3 pt-1">
                          <div className="p-4 rounded-xl"
                               style={{ backgroundColor: 'var(--color-soft)' }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                               style={{ color: 'var(--color-muted)' }}>
                              What happens when you approve
                            </p>
                            <p className="text-xs leading-relaxed"
                               style={{ color: 'var(--color-dark)' }}>
                              {getRefundInfo(ret)}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1.5"
                                   style={{ color: 'var(--color-dark)' }}>
                              Note to customer (optional)
                            </label>
                            <input
                              type="text"
                              value={notes[ret._id] || ''}
                              onChange={e => setNotes(n => ({ ...n, [ret._id]: e.target.value }))}
                              placeholder="e.g. Please ship the product back within 3 days..."
                              className="input text-sm"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAction(ret._id, 'approved')}
                              disabled={!!acting}
                              className="flex-1 flex items-center justify-center gap-2 py-3
                                         rounded-xl text-sm font-medium text-white
                                         transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: '#059669' }}>
                              {acting === ret._id + 'approved' ? (
                                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10"
                                          stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg> Processing Refund...</>
                              ) : (
                                <><FiCheck size={15} /> Approve & Refund ₹{ret.refundAmount?.toLocaleString('en-IN')}</>
                              )}
                            </button>
                            <button
                              onClick={() => handleAction(ret._id, 'rejected')}
                              disabled={!!acting}
                              className="flex items-center justify-center gap-2 px-5 py-3
                                         rounded-xl text-sm font-medium text-white
                                         transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: '#DC2626' }}>
                              {acting === ret._id + 'rejected' ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10"
                                          stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                              ) : (
                                <><FiX size={15} /> Reject</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── RESOLVED ── */}
                      {!isPending && (
                        <div className="space-y-3">
                          {ret.returnRequest?.adminNote && (
                            <div className="p-3 rounded-xl"
                                 style={{ backgroundColor: 'var(--color-soft)' }}>
                              <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                                 style={{ color: 'var(--color-muted)' }}>Admin Note</p>
                              <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                                {ret.returnRequest.adminNote}
                              </p>
                            </div>
                          )}
                          {ret.returnRequest?.requestedAt && (
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              Requested on {new Date(ret.returnRequest.requestedAt)
                                .toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </p>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}