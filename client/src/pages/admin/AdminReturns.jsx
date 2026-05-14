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
    pending:  { bg: '#FEF3C7', color: '#D97706', label: '⏳ Pending'  },
    approved: { bg: '#D1FAE5', color: '#059669', label: '✓ Approved' },
    rejected: { bg: '#FEE2E2', color: '#DC2626', label: '✗ Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

export default function AdminReturns() {
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('pending');
  const [expanded, setExpanded]   = useState(null);
  const [notes, setNotes]         = useState({});
  const [acting, setActing]       = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/returns/admin');
        setReturns(data);
      } catch {
        toast.error('Failed to load return requests');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAction = async (orderId, status) => {
    try {
      setActing(orderId + status);
      const { data } = await api.put(`/returns/admin/${orderId}`, {
        status,
        adminNote: notes[orderId] || '',
      });
      setReturns(prev => prev.map(o =>
        o._id === orderId ? data.order : o
      ));
      toast.success(`Return ${status} ✅`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActing(null);
    }
  };

  const filtered = filter === 'all'
    ? returns
    : returns.filter(o => o.returnRequest?.status === filter);

  const pendingCount = returns.filter(o => o.returnRequest?.status === 'pending').length;

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
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            myRaaz
          </p>
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
            { key: 'pending',  label: 'Pending'  },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All'      },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0"
              style={{
                backgroundColor: filter === key ? 'var(--color-primary)' : 'var(--color-soft)',
                color: filter === key ? 'white' : 'var(--color-muted)',
              }}>
              {label} ({key === 'all'
                ? returns.length
                : returns.filter(o => o.returnRequest?.status === key).length})
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
            {filtered.map(order => {
              const ret        = order.returnRequest;
              const isExpanded = expanded === order._id;
              const isPending  = ret.status === 'pending';

              return (
                <div key={order._id} className="bg-white rounded-2xl overflow-hidden"
                     style={{ boxShadow: 'var(--shadow-card)' }}>

                  {/* Card header */}
                  <div className="flex items-center justify-between p-5 cursor-pointer
                                  hover:bg-soft/30 transition-colors gap-4"
                       onClick={() => setExpanded(isExpanded ? null : order._id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnails */}
                      <div className="flex -space-x-2 shrink-0">
                        {order.orderItems?.slice(0, 2).map((item, i) => (
                          <div key={i} className="w-11 h-11 rounded-xl overflow-hidden
                                                   border-2 border-white"
                               style={{ backgroundColor: 'var(--color-soft)' }}>
                            <img src={item.image} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-xs font-semibold"
                                style={{ color: 'var(--color-dark)' }}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <ReturnBadge status={ret.status} />
                        </div>
                        <p className="text-sm font-medium truncate"
                           style={{ color: 'var(--color-dark)' }}>
                          {order.user?.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                          {order.user?.email || order.user?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-semibold"
                           style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                          ₹{order.totalPrice?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {new Date(ret.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      {isExpanded
                        ? <FiChevronUp size={16} style={{ color: 'var(--color-muted)' }} />
                        : <FiChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4"
                         style={{ borderTop: '1px solid var(--color-soft)' }}>

                      {/* Return reason */}
                      <div className="pt-2">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--color-muted)' }}>Return Reason</p>
                        <p className="text-sm font-medium"
                           style={{ color: 'var(--color-dark)' }}>{ret.reason}</p>
                      </div>

                      {/* Returnable vs non-returnable items */}
                      {ret.returnableItems?.length > 0 && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: '#F0FDF4' }}>
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            ✓ Returnable Items
                          </p>
                          {ret.returnableItems.map((name, i) => (
                            <p key={i} className="text-xs text-green-600">• {name}</p>
                          ))}
                        </div>
                      )}
                      {ret.nonReturnableItems?.length > 0 && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: '#FEF2F2' }}>
                          <p className="text-xs font-semibold text-red-600 mb-1">
                            ✗ Non-returnable Items
                          </p>
                          {ret.nonReturnableItems.map((name, i) => (
                            <p key={i} className="text-xs text-red-500">• {name}</p>
                          ))}
                        </div>
                      )}

                      {/* Order items */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest"
                           style={{ color: 'var(--color-muted)' }}>All Items in Order</p>
                        {order.orderItems?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                               style={{ backgroundColor: 'var(--color-soft)' }}>
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
                                 style={{ backgroundColor: 'white' }}>
                              <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium line-clamp-1"
                                 style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                Qty: {item.quantity} · ₹{item.price}
                              </p>
                            </div>
                            <p className="text-sm font-semibold shrink-0"
                               style={{ color: 'var(--color-primary)',
                                        fontFamily: 'var(--font-serif)' }}>
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping address */}
                      <div className="p-3 rounded-xl"
                           style={{ backgroundColor: 'var(--color-soft)' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--color-muted)' }}>Customer Address</p>
                        <p className="text-sm font-medium"
                           style={{ color: 'var(--color-dark)' }}>
                          {order.shippingAddress?.fullName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          📱 {order.shippingAddress?.phone}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {order.shippingAddress?.address}, {order.shippingAddress?.city},
                          {' '}{order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                        </p>
                      </div>

                      {/* Admin action — pending only */}
                      {isPending && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-medium mb-1.5"
                                   style={{ color: 'var(--color-dark)' }}>
                              Note to customer (optional)
                            </label>
                            <input
                              type="text"
                              value={notes[order._id] || ''}
                              onChange={e => setNotes(n => ({
                                ...n, [order._id]: e.target.value
                              }))}
                              placeholder="e.g. Please ship the product to our warehouse..."
                              className="input text-sm"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAction(order._id, 'approved')}
                              disabled={!!acting}
                              className="flex-1 flex items-center justify-center gap-2
                                         py-3 rounded-xl text-sm font-medium text-white
                                         transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: '#059669' }}>
                              {acting === order._id + 'approved' ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" fill="none"
                                       viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  Approving...
                                </>
                              ) : <><FiCheck size={15} /> Approve Return</>}
                            </button>
                            <button
                              onClick={() => handleAction(order._id, 'rejected')}
                              disabled={!!acting}
                              className="flex-1 flex items-center justify-center gap-2
                                         py-3 rounded-xl text-sm font-medium text-white
                                         transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: '#DC2626' }}>
                              {acting === order._id + 'rejected' ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" fill="none"
                                       viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  Rejecting...
                                </>
                              ) : <><FiX size={15} /> Reject Return</>}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Show admin note if resolved */}
                      {!isPending && ret.adminNote && (
                        <div className="p-3 rounded-xl"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                             style={{ color: 'var(--color-muted)' }}>Admin Note</p>
                          <p className="text-sm" style={{ color: 'var(--color-dark)' }}>
                            {ret.adminNote}
                          </p>
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