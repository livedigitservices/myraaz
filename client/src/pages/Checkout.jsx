import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMapPin, FiCreditCard, FiCheck, FiShoppingCart,
  FiArrowLeft, FiTruck, FiShield, FiLock, FiSmartphone
} from 'react-icons/fi';
import { toast }          from 'react-toastify';
import { loadStripe }     from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api                from '../services/api';
import { useCart }        from '../context/CartContext';
import { useAuth }        from '../context/AuthContext';

const STEPS = ['Address', 'Payment', 'Review'];

/* ─────────────────────────────────────────
   UPI APPS CONFIG
───────────────────────────────────────── */
const UPI_APPS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    color: '#1A73E8',
    bg: '#E8F0FE',
    icon: (
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107"/>
        <path d="M6.3 14.7l7 5.1C15.2 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2-.1.1 0 1.5 0 1.5z" fill="#FF3D00"/>
        <path d="M24 45c5.5 0 10.5-2 14.2-5.4l-6.6-5.5C29.6 35.9 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.5 41 15.7 45 24 45z" fill="#4CAF50"/>
        <path d="M44.5 20H24v8.5h11.8c-.6 2.6-2.1 4.8-4.2 6.3l6.6 5.5c-.4.4 6.8-5 6.8-16.3 0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>
      </svg>
    ),
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    color: '#5F259F',
    bg: '#EDE7F6',
    icon: (
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#5F259F"/>
        <path d="M33.5 17.5C33.5 12.8 29.7 9 25 9h-9v30l5.5-5.5V29h3.5c4.7 0 8.5-3.8 8.5-8.5v-3zm-5.5 5c0 1.9-1.6 3.5-3.5 3.5H21.5v-10H24c1.9 0 3.5 1.6 3.5 3.5v3z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'paytm',
    label: 'Paytm',
    color: '#00405C',
    bg: '#E0F7FA',
    icon: (
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#002970"/>
        <rect x="7" y="7" width="15" height="15" rx="3" fill="#00BAF2"/>
        <rect x="26" y="7" width="15" height="15" rx="3" fill="#00BAF2"/>
        <rect x="7" y="26" width="15" height="15" rx="3" fill="#00BAF2"/>
        <rect x="26" y="26" width="15" height="15" rx="3" fill="white"/>
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────
   SPINNER
───────────────────────────────────────── */
const Spin = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ─────────────────────────────────────────
   UPI BUTTON
───────────────────────────────────────── */
const UPIButton = ({ amount, orderId, upiApp, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { userInfo } = useAuth();
  const app = UPI_APPS.find(a => a.id === upiApp) || UPI_APPS[0];

  const handlePay = async () => {
    if (!window.Razorpay) return toast.error('Razorpay not loaded. Refresh the page.');
    if (!orderId) return toast.error('Order ID missing. Please go back and try again.');

    try {
      setLoading(true);
      const { data } = await api.post('/payment/razorpay/create-order', {
        amount: Number(amount),
      });




      const options = {
  key:         data.keyId,
  amount:      data.amount,
  currency:    data.currency,
  name:        'myRaaz',
  description: 'Hair Care Products',
  order_id:    data.orderId,
  prefill: {
    name:    userInfo?.name  || '',
    email:   userInfo?.email || '',
    contact: userInfo?.phone?.replace('+91', '') || '',
  },
  theme: { color: '#7C6A5E' },

  config: {
  display: {
    blocks: {
      upi: {
        name: 'Pay via UPI',
        instruments: [
          { method: 'upi', flows: ['intent'],  apps: [upiApp] }, // mobile app
          { method: 'upi', flows: ['qr']                      }, // desktop QR
          { method: 'upi', flows: ['collect']                 }, // UPI ID input
        ],
      },
      other: {
        name: 'Other Payment Methods',
        instruments: [
          { method: 'card' },
          { method: 'netbanking' },
        ],
      },
    },
    sequence:    ['block.upi', 'block.other'],
    preferences: { show_default_blocks: false },
  },
},

  modal: {
    ondismiss: () => {
      setLoading(false);
      toast.info('Payment cancelled');
    },
  },
  handler: async (response) => {
    try {
      await api.post('/payment/razorpay/verify', {
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        orderId,
      });
      onSuccess();
    } catch {
      toast.error('Payment verification failed. Contact support.');
    } finally {
      setLoading(false);
    }
  },
};



      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        toast.error(`Payment failed: ${r.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3.5 rounded-full text-white font-medium text-sm
                 transition-all hover:opacity-90 disabled:opacity-60
                 flex items-center justify-center gap-2"
      style={{ backgroundColor: app.color }}
    >
      {loading
        ? <><Spin /> Opening {app.label}...</>
        : <>📱 Pay ₹{Number(amount).toLocaleString('en-IN')} via {app.label}</>}
    </button>
  );
};

/* ─────────────────────────────────────────
   RAZORPAY BUTTON
───────────────────────────────────────── */
const RazorpayButton = ({ amount, orderId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { userInfo } = useAuth();

  const handlePay = async () => {
    if (!window.Razorpay) return toast.error('Razorpay not loaded. Refresh the page.');
    if (!orderId) return toast.error('Order ID missing. Please go back and try again.');

    try {
      setLoading(true);
      const { data } = await api.post('/payment/razorpay/create-order', {
        amount: Number(amount),
      });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        'myRaaz',
        description: 'Hair Care Products',
        order_id:    data.orderId,
        prefill: {
          name:    userInfo?.name  || '',
          email:   userInfo?.email || '',
          contact: userInfo?.phone?.replace('+91', '') || '',
        },
        theme: { color: '#7C6A5E' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment cancelled');
          },
        },
        handler: async (response) => {
          try {
            await api.post('/payment/razorpay/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId,
            });
            onSuccess();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        toast.error(`Payment failed: ${r.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3.5 rounded-full text-white font-medium text-sm
                 transition-all hover:opacity-90 disabled:opacity-60
                 flex items-center justify-center gap-2"
      style={{ backgroundColor: '#2D81EE' }}
    >
      {loading
        ? <><Spin /> Opening Razorpay...</>
        : <>💳 Pay ₹{Number(amount).toLocaleString('en-IN')} with Razorpay</>}
    </button>
  );
};

/* ─────────────────────────────────────────
   STRIPE FORM
───────────────────────────────────────── */
const StripeForm = ({ amount, orderId, onSuccess }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payment/stripe/create-intent', { amount, orderId });
      const result   = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) { setError(result.error.message); return; }
      await api.post('/payment/stripe/verify', {
        paymentIntentId: result.paymentIntent.id,
        orderId,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--color-soft)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-muted)' }}>
          Card Details
        </p>
        <CardElement options={{
          style: {
            base: {
              fontSize: '14px', color: '#3D3530', fontFamily: 'Inter, sans-serif',
              '::placeholder': { color: '#9E8F87' },
            },
            invalid: { color: '#ef4444' },
          },
          hidePostalCode: true,
        }} />
      </div>
      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}
      <div className="p-3 rounded-xl text-xs"
           style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
        🧪 Test card: <span className="font-mono font-semibold">4242 4242 4242 4242</span>
        · Any future date · Any CVC
      </div>
      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        className="w-full py-3.5 rounded-full text-white font-medium text-sm
                   transition-all hover:opacity-90 disabled:opacity-60
                   flex items-center justify-center gap-2"
        style={{ backgroundColor: '#635BFF' }}
      >
        {loading
          ? <><Spin /> Processing...</>
          : <><FiLock size={14} /> Pay ₹{amount.toLocaleString('en-IN')} with Stripe</>}
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────
   PAYMENT METHOD OPTION ROW
───────────────────────────────────────── */
const PaymentOption = ({ value, label, sub, emoji, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
    style={{
      border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-soft)',
      backgroundColor: selected ? 'var(--color-soft)' : 'white',
    }}
  >
    <span className="text-2xl">{emoji}</span>
    <div className="flex-1">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>{label}</p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
    </div>
    <div
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-soft)',
        backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
      }}
    >
      {selected && <FiCheck size={11} color="white" />}
    </div>
  </button>
);

/* ─────────────────────────────────────────
   UPI APP SELECTOR
───────────────────────────────────────── */
const UPIAppSelector = ({ selected, onChange }) => (
  <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-soft)' }}>
    <p className="text-xs font-semibold mb-3 flex items-center gap-1.5"
       style={{ color: 'var(--color-dark)' }}>
      <FiSmartphone size={13} /> Select UPI App
    </p>
    <div className="grid grid-cols-3 gap-3">
      {UPI_APPS.map((app) => (
        <button
          key={app.id}
          type="button"
          onClick={() => onChange(app.id)}
          className="flex flex-col items-center gap-2.5 py-3.5 px-2 rounded-xl transition-all duration-200"
          style={{
            border: selected === app.id
              ? `2px solid ${app.color}`
              : '1.5px solid transparent',
            backgroundColor: selected === app.id ? 'white' : 'rgba(255,255,255,0.55)',
            boxShadow: selected === app.id ? `0 2px 12px ${app.color}22` : 'none',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: app.bg }}
          >
            {app.icon}
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: selected === app.id ? app.color : 'var(--color-muted)' }}
          >
            {app.label}
          </span>
          {selected === app.id && (
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: app.color }}
            >
              <FiCheck size={9} color="white" strokeWidth={3} />
            </span>
          )}
        </button>
      ))}
    </div>
    <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-muted)' }}>
      Razorpay will open your selected app directly
    </p>
  </div>
);

/* ─────────────────────────────────────────
   MAIN CHECKOUT
───────────────────────────────────────── */
function CheckoutContent() {
  const location     = useLocation();
  const { userInfo } = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();

  const { discountAmount = 0, shipping = 0, finalTotal } = location.state || {};
  const grandTotal = finalTotal ?? totalPrice + shipping - discountAmount;

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced]   = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [payment, setPayment] = useState('COD');
  const [upiApp, setUpiApp]   = useState('gpay');

  const [address, setAddress] = useState({
    fullName: userInfo?.name  || '',
    phone:    userInfo?.phone?.replace('+91', '') || '',
    address:  userInfo?.defaultAddress?.address || '',
    city:     userInfo?.defaultAddress?.city    || '',
    state:    userInfo?.defaultAddress?.state   || '',
    pincode:  userInfo?.defaultAddress?.pincode || '',
  });

  const handleAddressChange = (e) =>
    setAddress(a => ({ ...a, [e.target.name]: e.target.value }));

  const validateAddress = () => {
    const { fullName, phone, address: addr, city, state, pincode } = address;
    if (!fullName || !phone || !addr || !city || !state || !pincode)
      return toast.error('Please fill in all address fields'), false;
    if (!/^\d{6}$/.test(pincode))
      return toast.error('Pincode must be 6 digits'), false;
    if (!/^\d{10}$/.test(phone.replace(/\s/g, '')))
      return toast.error('Please enter a valid 10-digit phone number'), false;
    return true;
  };

  const placeOrder = async (method = payment) => {
    const { data } = await api.post('/orders', {
      orderItems: cartItems.map(i => ({
        product:  i._id,
        name:     i.name,
        image:    i.image,
        price:    i.price,
        quantity: i.quantity,
      })),
      shippingAddress: {
        fullName: address.fullName,
        phone:    address.phone,
        address:  address.address,
        city:     address.city,
        state:    address.state,
        pincode:  address.pincode,
      },
      paymentMethod: method === 'UPI' ? 'Razorpay' : method,
      itemsPrice:    totalPrice,
      shippingPrice: shipping,
      totalPrice:    grandTotal,
    });
    return data._id;
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!validateAddress()) return;
      setStep(1);
      window.scrollTo(0, 0);
      return;
    }

    if (step === 1) {
      if (payment === 'COD') {
        setStep(2);
        window.scrollTo(0, 0);
        return;
      }
      try {
        setLoading(true);
        toast.info('Creating your order...');
        const id = await placeOrder();
        setOrderId(id);
        setStep(2);
        window.scrollTo(0, 0);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCOD = async () => {
    try {
      setLoading(true);
      const id = await placeOrder('COD');
      setOrderId(id);
      clearCart();
      setPlaced(true);
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setPlaced(true);
    toast.success('Payment successful! Order placed 🎉');
    window.scrollTo(0, 0);
  };

  /* ── Success screen ── */
  if (placed) return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ backgroundColor: '#D1FAE5' }}>
          <FiCheck size={36} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
          Order Placed! 🎉
        </h1>
        <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
          Thank you, {userInfo?.name?.split(' ')[0]}!
        </p>
        <p className="text-xs font-mono mb-8 px-3 py-2 rounded-xl inline-block"
           style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
          Order ID: #{orderId?.slice(-10).toUpperCase()}
        </p>
        <div className="bg-white rounded-2xl p-5 mb-6 text-left"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          {[
            { icon: <FiTruck size={15} />,  text: 'Estimated delivery in 3–5 business days' },
            { icon: <FiShield size={15} />, text: '100% authentic products guaranteed'       },
            { icon: <FiCheck size={15} />,  text: 'Order confirmation sent to your email'    },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 py-2.5"
                 style={{ borderBottom: '1px solid var(--color-soft)' }}>
              <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
              <p className="text-sm" style={{ color: 'var(--color-dark)' }}>{text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard/orders"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full
                           text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)' }}>
            Track Order
          </Link>
          <Link to="/products"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full
                           text-sm font-medium"
                style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="text-center">
        <p className="text-lg font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
          Your cart is empty
        </p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: 'var(--color-primary)' }} className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/cart"
                className="flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white w-fit">
            <FiArrowLeft size={14} /> Back to Cart
          </Link>
          <h1 className="text-2xl font-semibold text-white"
              style={{ fontFamily: 'var(--font-serif)' }}>Checkout</h1>

          {/* Steps */}
          <div className="flex items-center gap-0 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                       style={{
                         backgroundColor: i <= step ? 'white' : 'rgba(255,255,255,0.2)',
                         color: i <= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                       }}>
                    {i < step ? '✓' : i + 1}
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

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* STEP 0 — Address */}
            {step === 0 && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiMapPin size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--color-dark)' }}>
                    Delivery Address
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'fullName', label: 'Full Name',      col: 1, type: 'text', placeholder: 'Priya Sharma'    },
                    { name: 'phone',    label: 'Phone Number',   col: 1, type: 'tel',  placeholder: '9876543210'       },
                    { name: 'address',  label: 'Street Address', col: 2, type: 'text', placeholder: '123, Main Street' },
                    { name: 'city',     label: 'City',           col: 1, type: 'text', placeholder: 'Mumbai'           },
                    { name: 'state',    label: 'State',          col: 1, type: 'text', placeholder: 'Maharashtra'      },
                    { name: 'pincode',  label: 'Pincode',        col: 1, type: 'text', placeholder: '400001'           },
                  ].map(({ name, label, col, type, placeholder }) => (
                    <div key={name} className={`col-span-${col}`}>
                      <label className="block text-xs font-medium mb-1.5"
                             style={{ color: 'var(--color-dark)' }}>{label}</label>
                      <input
                        type={type}
                        name={name}
                        value={address[name]}
                        onChange={handleAddressChange}
                        placeholder={placeholder}
                        className="input text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 — Payment */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiCreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--color-dark)' }}>
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-3">
                  <PaymentOption
                    value="COD"
                    label="Cash on Delivery"
                    sub="Pay when your order arrives"
                    emoji="💵"
                    selected={payment === 'COD'}
                    onClick={() => setPayment('COD')}
                  />

                  {/* UPI with expandable app selector */}
                  <div>
                    <PaymentOption
                      value="UPI"
                      label="UPI"
                      sub="GPay · PhonePe · Paytm — instant & secure"
                      emoji="📱"
                      selected={payment === 'UPI'}
                      onClick={() => setPayment('UPI')}
                    />
                    {payment === 'UPI' && (
                      <UPIAppSelector selected={upiApp} onChange={setUpiApp} />
                    )}
                  </div>

                  <PaymentOption
                    value="Razorpay"
                    label="Razorpay"
                    sub="Cards, net banking & all UPI options"
                    emoji="🇮🇳"
                    selected={payment === 'Razorpay'}
                    onClick={() => setPayment('Razorpay')}
                  />

                  <PaymentOption
                    value="Stripe"
                    label="Stripe"
                    sub="International debit & credit cards"
                    emoji="🌍"
                    selected={payment === 'Stripe'}
                    onClick={() => setPayment('Stripe')}
                  />
                </div>

                {/* Method-specific info */}
                <div className="mt-4 p-3 rounded-xl text-xs"
                     style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                  {payment === 'COD'      && '💵 Pay with cash when your order arrives. No prepayment required.'}
                  {payment === 'UPI'      && '📱 Click Continue — your selected UPI app will open on the next screen.'}
                  {payment === 'Razorpay' && '🇮🇳 Click Continue — Razorpay checkout will open on the next screen.'}
                  {payment === 'Stripe'   && '🌍 Click Continue — Enter your card details on the next screen.'}
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <div className="space-y-4">

                {/* Address summary */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: 'var(--color-dark)' }}>
                      <FiMapPin size={14} style={{ color: 'var(--color-primary)' }} />
                      Delivering to
                    </h3>
                    <button onClick={() => { setStep(0); setOrderId(null); }}
                      className="text-xs hover:underline"
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
                    <h3 className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: 'var(--color-dark)' }}>
                      <FiCreditCard size={14} style={{ color: 'var(--color-primary)' }} />
                      Payment
                    </h3>
                    <button onClick={() => { setStep(1); setOrderId(null); }}
                      className="text-xs hover:underline"
                      style={{ color: 'var(--color-primary)' }}>Edit</button>
                  </div>
                  <div className="flex items-center gap-3">
                    {payment === 'UPI' && (() => {
                      const app = UPI_APPS.find(a => a.id === upiApp);
                      return (
                        <>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                               style={{ backgroundColor: app.bg }}>
                            <div style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
                              {app.icon}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                              {app.label} (UPI)
                            </p>
                            {orderId && (
                              <p className="text-xs font-mono mt-0.5"
                                 style={{ color: 'var(--color-muted)' }}>
                                Order #{orderId.slice(-8).toUpperCase()} ready
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                    {payment !== 'UPI' && (
                      <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                        {payment === 'COD'      ? '💵 Cash on Delivery'
                          : payment === 'Razorpay' ? '🇮🇳 Razorpay'
                          : '🌍 Stripe'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"
                      style={{ color: 'var(--color-dark)' }}>
                    <FiShoppingCart size={14} style={{ color: 'var(--color-primary)' }} />
                    Order Items ({cartItems.length})
                  </h3>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                             style={{ backgroundColor: 'var(--color-soft)' }}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1"
                             style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            ₹{item.price} × {item.quantity}
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

                {/* UPI payment button */}
                {payment === 'UPI' && (
                  <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>
                      Complete Payment
                    </h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                      Tap below to open {UPI_APPS.find(a => a.id === upiApp)?.label}
                    </p>
                    {orderId ? (
                      <UPIButton
                        amount={grandTotal}
                        orderId={orderId}
                        upiApp={upiApp}
                        onSuccess={handlePaymentSuccess}
                      />
                    ) : (
                      <p className="text-sm text-center py-3" style={{ color: 'var(--color-muted)' }}>
                        Setting up payment... please wait.
                      </p>
                    )}
                  </div>
                )}

                {/* Razorpay payment button */}
                {payment === 'Razorpay' && (
                  <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
                      Complete Payment
                    </h3>
                    {orderId ? (
                      <RazorpayButton
                        amount={grandTotal}
                        orderId={orderId}
                        onSuccess={handlePaymentSuccess}
                      />
                    ) : (
                      <p className="text-sm text-center py-3" style={{ color: 'var(--color-muted)' }}>
                        Setting up payment... please wait.
                      </p>
                    )}
                  </div>
                )}

                {/* Stripe form */}
                {payment === 'Stripe' && orderId && (
                  <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
                      Enter Card Details
                    </h3>
                    <StripeForm
                      amount={grandTotal}
                      orderId={orderId}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── NAV BUTTONS ── */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => { setStep(s => s - 1); setOrderId(null); }}
                  className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                  style={{ border: '1.5px solid var(--color-soft)', color: 'var(--color-muted)' }}>
                  ← Back
                </button>
              )}

              {step < 2 && (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5
                             rounded-full text-white text-sm font-medium
                             transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading ? <><Spin /> Preparing order...</> : 'Continue →'}
                </button>
              )}

              {step === 2 && payment === 'COD' && (
                <button
                  onClick={handleCOD}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5
                             rounded-full text-white text-sm font-medium
                             transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading ? <><Spin /> Placing Order...</> : <><FiCheck size={15} /> Place Order (COD)</>}
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT — Order Summary ── */}
          <div>
            <div className="bg-white rounded-2xl p-5 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
                Order Summary
              </h3>
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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

              <div className="space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? '#22c55e' : 'inherit' }}>
                    {shipping === 0 ? 'Free' : `₹${shipping}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-500">Discount</span>
                    <span className="text-green-500">− ₹{discountAmount}</span>
                  </div>
                )}
              </div>

              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-dark)' }}>
                  Total
                </span>
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

/* ─────────────────────────────────────────
   EXPORT
───────────────────────────────────────── */
export default function Checkout() {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(
    () => stripeKey ? loadStripe(stripeKey) : null,
    [stripeKey]
  );
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}