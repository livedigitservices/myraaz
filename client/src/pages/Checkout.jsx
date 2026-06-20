import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiMapPin, FiCreditCard, FiCheck, FiShoppingCart,
  FiArrowLeft, FiTruck, FiShield, FiLock, FiAlertCircle,
  FiArrowRight, FiZap, FiPackage,
} from 'react-icons/fi';
import { toast }   from 'react-toastify';
import api         from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const STEPS = ['Address', 'Payment', 'Review'];

const RupeeIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="6" x2="18" y2="6" />
    <line x1="6" y1="10" x2="18" y2="10" />
    <line x1="6" y1="10" x2="14" y2="20" />
    <line x1="6" y1="10" x2="12" y2="10" strokeWidth="0" />
    <path d="M6 10 Q14 10 14 6" />
  </svg>
);

const PAYMENT_METHODS = [
  { id: 'COD',      label: 'Cash on delivery', sub: 'Pay when your order arrives',                   icon: RupeeIcon   },
  { id: 'Razorpay', label: 'Pay online',        sub: 'UPI · Cards · Netbanking · Wallets',           icon: FiCreditCard },
  { id: 'Wallet',   label: 'myRaaz wallet',     sub: null,                                            icon: FiZap       },
];

/* ─────────────────────────────────────────────
   SMALL UTILITIES
───────────────────────────────────────────── */
const Spin = ({ size = 16 }) => (
  <svg style={{ width: size, height: size }} className="animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ─────────────────────────────────────────────
   PAYMENT OPTION BUTTON
───────────────────────────────────────────── */
const PaymentOption = ({ method, selected, onClick, walletBalance, grandTotal }) => {
  const Icon         = method.icon;
  const isWallet     = method.id === 'Wallet';
  const insufficient = isWallet && walletBalance < grandTotal;

  const sub = isWallet
    ? `Balance: ₹${(walletBalance || 0).toLocaleString('en-IN')} · Instant payment`
    : method.sub;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
      style={{
        border:          selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-soft)',
        backgroundColor: selected ? 'var(--color-soft)' : 'white',
        opacity:         insufficient ? 0.6 : 1,
      }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
           style={{ backgroundColor: selected ? 'var(--color-primary)' : 'var(--color-soft)' }}>
        <Icon size={18} color={selected ? 'white' : 'var(--color-primary)'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>{method.label}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{sub}</p>
        {insufficient && selected && (
          <p className="text-xs mt-0.5 text-red-500 font-medium flex items-center gap-1">
            <FiAlertCircle size={11} />
            Insufficient balance — need ₹{(grandTotal - walletBalance).toLocaleString('en-IN')} more
          </p>
        )}
      </div>
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
           style={{
             borderColor:     selected ? 'var(--color-primary)' : 'var(--color-soft)',
             backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
           }}>
        {selected && <FiCheck size={11} color="white" />}
      </div>
    </button>
  );
};

const SummaryRow = ({ label, value, green, bold }) => (
  <div className="flex justify-between items-center text-sm">
    <span style={{ color: green ? '#22c55e' : 'var(--color-muted)' }}>{label}</span>
    <span className={bold ? 'font-semibold' : ''}
          style={{ color: green ? '#22c55e' : 'var(--color-dark)' }}>
      {value}
    </span>
  </div>
);

/* ─────────────────────────────────────────────
   RAZORPAY MODAL BUTTON
   FIX: placeOrder is called ONLY inside handler() — which Razorpay
   fires only after a successful payment. No ghost pending orders.
───────────────────────────────────────────── */
const RazorpayButton = ({ amount, onPlaceAndVerify }) => {
  const [loading, setLoading] = useState(false);
  const { userInfo }          = useAuth();
  const cancelledRef          = useRef(false);

  const handlePay = useCallback(async () => {
    if (!window.Razorpay) { toast.error('Razorpay SDK not loaded — please refresh.'); return; }
    cancelledRef.current = false;
    setLoading(true);

    let rzpOrderData;
    try {
      const { data } = await api.post('/payment/razorpay/create-order', { amount: Number(amount) });
      rzpOrderData = data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reach payment gateway. Try again.');
      setLoading(false);
      return;
    }

    const options = {
      key:         rzpOrderData.keyId,
      amount:      rzpOrderData.amount,
      currency:    rzpOrderData.currency,
      name:        'myRaaz',
      description: 'Hair Care Products',
      order_id:    rzpOrderData.orderId,
      prefill: {
        name:    userInfo?.name  || '',
        email:   userInfo?.email || '',
        contact: (userInfo?.phone || '').replace(/^\+91/, ''),
      },
      config: {
        display: {
          blocks: {
            upi:   { name: 'Pay via UPI',         instruments: [{ method: 'upi' }]        },
            cards: { name: 'Pay via Debit/Credit', instruments: [{ method: 'card' }]       },
            nb:    { name: 'Netbanking',           instruments: [{ method: 'netbanking' }] },
          },
          sequence: ['block.upi', 'block.cards', 'block.nb'],
          preferences: { show_default_blocks: false },
        },
      },
      theme: { color: '#7C6A5E' },
      modal: {
        ondismiss: () => {
          if (!cancelledRef.current) toast.info('Payment cancelled');
          setLoading(false);
        },
        escape: false, handleback: true, animation: true, confirm_close: true,
      },
      // ✅ Order is created here — ONLY after Razorpay confirms payment
      handler: async (response) => {
        cancelledRef.current = true;
        try {
          await onPlaceAndVerify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
            'Payment received but order confirmation failed. Contact support with payment ID: ' +
            response.razorpay_payment_id
          );
        } finally { setLoading(false); }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) => {
      toast.error(`Payment failed: ${r.error.description}`);
      setLoading(false);
    });
    rzp.open();
  }, [amount, userInfo, onPlaceAndVerify]);

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-4 rounded-full text-white font-medium text-sm transition-all
                 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {loading
        ? <><Spin /> Opening Razorpay…</>
        : <><FiLock size={15} /> Pay ₹{Number(amount).toLocaleString('en-IN')}</>
      }
    </button>
  );
};

/* ─────────────────────────────────────────────
   ADDRESS FIELDS CONFIG
───────────────────────────────────────────── */
const ADDRESS_FIELDS = [
  { name: 'fullName', label: 'Full name',      span: 1, type: 'text', placeholder: 'Tharun Mellachervu' },
  { name: 'phone',    label: 'Phone number',   span: 1, type: 'tel',  placeholder: '9876543210'         },
  { name: 'address',  label: 'Street address', span: 2, type: 'text', placeholder: '123, Main Street'   },
  { name: 'city',     label: 'City',           span: 1, type: 'text', placeholder: 'Hyderabad'          },
  { name: 'state',    label: 'State',          span: 1, type: 'text', placeholder: 'Telangana'          },
  { name: 'pincode',  label: 'Pincode',        span: 1, type: 'text', placeholder: '500001'             },
];

function validateAddress(address) {
  const { fullName, phone, address: addr, city, state, pincode } = address;
  if (!fullName.trim() || !addr.trim() || !city.trim() || !state.trim())
    return 'Please fill in all address fields.';
  if (!/^\d{6}$/.test(pincode.trim()))
    return 'Pincode must be exactly 6 digits.';
  if (!/^\d{10}$/.test(phone.replace(/\s/g, '')))
    return 'Enter a valid 10-digit phone number.';
  return null;
}

/* ─────────────────────────────────────────────
   MAIN CHECKOUT
───────────────────────────────────────────── */
export default function Checkout() {
  const location                             = useLocation();
  const { userInfo }                         = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();

  const { discountAmount = 0, shipping = 0, finalTotal } = location.state || {};
  const grandTotal = finalTotal ?? (totalPrice + shipping - discountAmount);

  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [placed, setPlaced]           = useState(false);
  const [orderId, setOrderId]         = useState(null);
  const [payment, setPayment]         = useState('COD');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const [address, setAddress] = useState({
    fullName: userInfo?.name  || '',
    phone:    (userInfo?.phone || '').replace(/^\+91/, ''),
    address:  userInfo?.defaultAddress?.address || '',
    city:     userInfo?.defaultAddress?.city    || '',
    state:    userInfo?.defaultAddress?.state   || '',
    pincode:  userInfo?.defaultAddress?.pincode || '',
  });

  useEffect(() => {
    if (!userInfo) { setWalletLoading(false); return; }
    api.get('/returns/wallet')
      .then(({ data }) => setWalletBalance(data.balance || 0))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, [userInfo]);

  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    setAddress(a => ({ ...a, [name]: value }));
  }, []);

  const buildOrderPayload = useCallback((method) => ({
    orderItems: cartItems.map(i => ({
      product:  i._id,
      name:     i.name,
      image:    i.image || i.images?.[0] || '',
      price:    i.price,
      quantity: i.quantity,
    })),
    shippingAddress: {
      fullName: address.fullName.trim(),
      phone:    address.phone.trim(),
      address:  address.address.trim(),
      city:     address.city.trim(),
      state:    address.state.trim(),
      pincode:  address.pincode.trim(),
    },
    paymentMethod: method,
    itemsPrice:    totalPrice,
    shippingPrice: shipping,
    totalPrice:    grandTotal,
  }), [cartItems, address, totalPrice, shipping, grandTotal]);

  const placeOrder = useCallback(async (method) => {
    const { data } = await api.post('/orders', buildOrderPayload(method));
    return data._id;
  }, [buildOrderPayload]);

  const handleAddressContinue = () => {
    const error = validateAddress(address);
    if (error) { toast.error(error); return; }
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentContinue = () => {
    if (payment === 'Wallet' && walletBalance < grandTotal) {
      toast.error('Insufficient wallet balance. Please choose another payment method.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── COD ── */
  const handleCOD = useCallback(async () => {
    try {
      setLoading(true);
      const id = await placeOrder('COD');
      setOrderId(id);
      clearCart();
      setPlaced(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally { setLoading(false); }
  }, [placeOrder, clearCart]);

  /* ── Wallet ──
     FIX: single placeOrder call — server handles debit atomically.
     No separate /payment/wallet call that could leave a stuck pending order. */
  const handleWalletPay = useCallback(async () => {
    if (walletBalance < grandTotal) {
      toast.error(`Insufficient balance. Available: ₹${walletBalance.toLocaleString('en-IN')}`);
      return;
    }
    try {
      setLoading(true);
      const id = await placeOrder('Wallet');
      setOrderId(id);
      clearCart();
      setPlaced(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wallet payment failed. Please try again.');
    } finally { setLoading(false); }
  }, [walletBalance, grandTotal, placeOrder, clearCart]);

  /* ── Razorpay modal ──
     FIX: placeOrder called only after Razorpay confirms payment in handler(). */
  const handleRazorpayPlaceAndVerify = useCallback(async ({
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  }) => {
    const id = await placeOrder('Razorpay');
    setOrderId(id);
    await api.post('/payment/razorpay/verify', {
      razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId: id,
    });
    clearCart();
    setPlaced(true);
    toast.success('Payment successful! Order placed.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [placeOrder, clearCart]);

  const paymentLabel = {
    COD:      { icon: <RupeeIcon size={14} color="var(--color-primary)" />, text: 'Cash on delivery'     },
    Razorpay: { icon: <FiCreditCard size={14} />,                           text: 'Pay online (Razorpay)' },
    Wallet:   { icon: <FiZap size={14} />,                                  text: 'myRaaz Wallet'         },
  }[payment];

  /* ── Success screen ── */
  if (placed) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ backgroundColor: '#D1FAE5' }}>
          <FiCheck size={36} color="#059669" />
        </div>
        <h1 className="text-3xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
          Order placed!
        </h1>
        <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
          Thank you, {userInfo?.name?.split(' ')[0]}! We'll get this to you soon.
        </p>
        {orderId && (
          <p className="text-xs font-mono mb-8 px-3 py-2 rounded-xl inline-block"
             style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
            Order ID: #{orderId.slice(-10).toUpperCase()}
          </p>
        )}
        <div className="bg-white rounded-2xl p-5 mb-6 text-left" style={{ boxShadow: 'var(--shadow-card)' }}>
          {[
            { icon: <FiTruck size={15} />,   label: 'Estimated delivery in 3–5 business days' },
            { icon: <FiShield size={15} />,  label: '100% authentic products guaranteed'       },
            { icon: <FiPackage size={15} />, label: 'Order confirmation sent to your account'  },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 py-2.5"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
              <p className="text-sm" style={{ color: 'var(--color-dark)' }}>{label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard/orders"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiPackage size={14} /> Track order
          </Link>
          <Link to="/products"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
                style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}>
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="text-center">
        <FiShoppingCart size={40} className="mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
        <p className="text-lg font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>Your cart is empty</p>
        <Link to="/products" className="btn-primary">Shop now</Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-primary)' }} className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/cart"
                className="flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white transition-colors w-fit">
            <FiArrowLeft size={14} /> Back to cart
          </Link>
          <h1 className="text-2xl font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}>Checkout</h1>
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                       style={{
                         backgroundColor: i <= step ? 'white' : 'rgba(255,255,255,0.2)',
                         color:           i <= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                       }}>
                    {i < step ? <FiCheck size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-medium"
                        style={{ color: i <= step ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-10 h-px mx-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Step 0: Address */}
            {step === 0 && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiMapPin size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--color-dark)' }}>
                    Delivery address
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {ADDRESS_FIELDS.map(({ name, label, span, type, placeholder }) => (
                    <div key={name} className={`col-span-${span}`}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
                        {label}
                      </label>
                      <input
                        type={type}
                        name={name}
                        value={address[name]}
                        onChange={handleAddressChange}
                        placeholder={placeholder}
                        autoComplete={name === 'fullName' ? 'name' : name}
                        className="input text-sm w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiCreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--color-dark)' }}>
                    Payment method
                  </h2>
                </div>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentOption
                      key={method.id}
                      method={method}
                      selected={payment === method.id}
                      onClick={() => setPayment(method.id)}
                      walletBalance={walletBalance}
                      grandTotal={grandTotal}
                    />
                  ))}
                </div>

                {payment === 'Wallet' && !walletLoading && (
                  <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-soft)' }}>
                    <SummaryRow label="Wallet balance" value={`₹${walletBalance.toLocaleString('en-IN')}`}
                                green={walletBalance >= grandTotal} />
                    <div className="mt-2">
                      <SummaryRow label="Order total" value={`₹${grandTotal.toLocaleString('en-IN')}`} />
                    </div>
                    {walletBalance >= grandTotal ? (
                      <p className="text-xs mt-3 text-green-600 font-medium flex items-center gap-1">
                        <FiCheck size={12} /> Sufficient balance — payment will be instant
                      </p>
                    ) : (
                      <p className="text-xs mt-3 text-red-500 flex items-center gap-1">
                        <FiAlertCircle size={12} />
                        Need ₹{(grandTotal - walletBalance).toLocaleString('en-IN')} more. Choose another method.
                      </p>
                    )}
                  </div>
                )}

                {payment === 'Razorpay' && (
                  <div className="mt-4 p-3 rounded-xl flex items-start gap-2 text-xs"
                       style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                    <FiLock size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    Secured by Razorpay. Supports UPI (GPay, PhonePe, Paytm),
                    debit/credit cards, and netbanking.
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-4">

                {/* Address summary */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-dark)' }}>
                      <FiMapPin size={14} style={{ color: 'var(--color-primary)' }} /> Delivering to
                    </h3>
                    <button onClick={() => setStep(0)} className="text-xs hover:underline"
                            style={{ color: 'var(--color-primary)' }}>Edit</button>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                    {address.fullName} · {address.phone}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {address.address}, {address.city}, {address.state} — {address.pincode}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-dark)' }}>
                      <FiCreditCard size={14} style={{ color: 'var(--color-primary)' }} /> Payment
                    </h3>
                    <button onClick={() => setStep(1)} className="text-xs hover:underline"
                            style={{ color: 'var(--color-primary)' }}>Edit</button>
                  </div>
                  <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-dark)' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{paymentLabel.icon}</span>
                    {paymentLabel.text}
                  </p>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-dark)' }}>
                    <FiShoppingCart size={14} style={{ color: 'var(--color-primary)' }} />
                    Order items ({cartItems.length})
                  </h3>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <img src={item.image || item.images?.[0]} alt={item.name}
                               className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--color-dark)' }}>
                            {item.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0"
                           style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Razorpay */}
                {payment === 'Razorpay' && (
                  <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"
                        style={{ color: 'var(--color-dark)' }}>
                      <FiLock size={14} style={{ color: 'var(--color-primary)' }} /> Complete payment
                    </h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                      Your order is created only after payment is confirmed.
                    </p>
                    <RazorpayButton amount={grandTotal} onPlaceAndVerify={handleRazorpayPlaceAndVerify} />
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2"
                        style={{ border: '1.5px solid var(--color-soft)', color: 'var(--color-muted)' }}>
                  <FiArrowLeft size={14} /> Back
                </button>
              )}

              {step === 0 && (
                <button onClick={handleAddressContinue}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full
                                   text-white text-sm font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                  Continue <FiArrowRight size={14} />
                </button>
              )}

              {step === 1 && (
                <button onClick={handlePaymentContinue}
                        disabled={payment === 'Wallet' && walletBalance < grandTotal}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full
                                   text-white text-sm font-medium transition-all hover:opacity-90
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                  Continue <FiArrowRight size={14} />
                </button>
              )}

              {step === 2 && payment === 'COD' && (
                <button onClick={handleCOD} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full
                                   text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading ? <><Spin /> Placing order…</> : <><FiCheck size={15} /> Place order (COD)</>}
                </button>
              )}

              {step === 2 && payment === 'Wallet' && (
                <button onClick={handleWalletPay}
                        disabled={loading || walletBalance < grandTotal}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full
                                   text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading
                    ? <><Spin /> Processing…</>
                    : <><FiZap size={14} /> Pay ₹{grandTotal.toLocaleString('en-IN')} from wallet</>
                  }
                </button>
              )}
              {/* Razorpay: button lives inside the payment card above */}
            </div>
          </div>

          {/* Right column — Order summary */}
          <div>
            <div className="bg-white rounded-2xl p-5 sticky top-24" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
                Order summary
              </h3>
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <img src={item.image || item.images?.[0]} alt={item.name}
                           className="w-full h-full object-cover" />
                    </div>
                    <p className="flex-1 text-xs line-clamp-1" style={{ color: 'var(--color-dark)' }}>
                      {item.name}
                      <span style={{ color: 'var(--color-muted)' }}> × {item.quantity}</span>
                    </p>
                    <p className="text-xs font-medium shrink-0" style={{ color: 'var(--color-dark)' }}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
              <div className="space-y-2.5 mb-4">
                <SummaryRow label="Subtotal" value={`₹${totalPrice.toLocaleString('en-IN')}`} />
                <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : `₹${shipping}`} green={shipping === 0} />
                {discountAmount > 0 && (
                  <SummaryRow label="Discount" value={`− ₹${discountAmount.toLocaleString('en-IN')}`} green />
                )}
              </div>
              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
              <div className="flex justify-between items-center mb-5">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-dark)' }}>Total</span>
                <span className="text-2xl font-semibold"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 pt-4"
                   style={{ borderTop: '1px solid var(--color-soft)' }}>
                <div className="flex items-center gap-1">
                  <FiShield size={11} style={{ color: 'var(--color-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiLock size={11} style={{ color: 'var(--color-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Encrypted</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}