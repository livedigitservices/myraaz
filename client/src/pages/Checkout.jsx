import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMapPin, FiCreditCard, FiCheck, FiShoppingCart,
  FiArrowLeft, FiTruck, FiShield, FiLock
} from 'react-icons/fi';
import { toast }          from 'react-toastify';
import { loadStripe }     from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api                from '../services/api';
import { useCart }        from '../context/CartContext';
import { useAuth }        from '../context/AuthContext';

const STEPS = ['Address', 'Payment', 'Review'];

/* ── Spinner ── */
const Spin = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ══════════════════════════════════════
   RAZORPAY BUTTON
══════════════════════════════════════ */
const RazorpayButton = ({ amount, orderId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { userInfo }          = useAuth();

  const handlePay = async () => {
    if (!window.Razorpay)
      return toast.error('Razorpay not loaded. Refresh the page.');
    if (!orderId)
      return toast.error('Order ID missing. Please go back and try again.');

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
    <button onClick={handlePay} disabled={loading}
      className="w-full py-3.5 rounded-full text-white font-medium text-sm
                 transition-all hover:opacity-90 disabled:opacity-60
                 flex items-center justify-center gap-2"
      style={{ backgroundColor: '#2D81EE' }}>
      {loading
        ? <><Spin /> Opening Razorpay...</>
        : <>💳 Pay ₹{Number(amount).toLocaleString('en-IN')} with Razorpay</>}
    </button>
  );
};

/* ══════════════════════════════════════
   STRIPE FORM
══════════════════════════════════════ */
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
      <button onClick={handlePay} disabled={loading || !stripe}
        className="w-full py-3.5 rounded-full text-white font-medium text-sm
                   transition-all hover:opacity-90 disabled:opacity-60
                   flex items-center justify-center gap-2"
        style={{ backgroundColor: '#635BFF' }}>
        {loading
          ? <><Spin /> Processing...</>
          : <><FiLock size={14} /> Pay ₹{amount.toLocaleString('en-IN')} with Stripe</>}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN CHECKOUT
══════════════════════════════════════ */
function CheckoutContent() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { userInfo } = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();

  const { appliedPromo, discountAmount = 0, shipping = 0, finalTotal } =
    location.state || {};
  const grandTotal = finalTotal ?? totalPrice + shipping - discountAmount;

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced]   = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [payment, setPayment] = useState('COD');

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

  /* ── Create order in DB ── */
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
      paymentMethod: method,
      itemsPrice:    totalPrice,
      shippingPrice: shipping,
      totalPrice:    grandTotal,
    });
    return data._id;
  };

  /* ── Step navigation ── */
  const handleNext = async () => {
    /* Step 0 → 1: validate address */
    if (step === 0) {
      if (!validateAddress()) return;
      setStep(1);
      window.scrollTo(0, 0);
      return;
    }

    /* Step 1 → 2 */
    if (step === 1) {
      if (payment === 'COD') {
        /* COD: just move to review, place on final button */
        setStep(2);
        window.scrollTo(0, 0);
        return;
      }

      /* Online payment: place order NOW so orderId is ready on Step 2 */
      try {
        setLoading(true);
        toast.info('Creating your order...');
        const id = await placeOrder();
        setOrderId(id);
        console.log('✅ Order created:', id);
        setStep(2);
        window.scrollTo(0, 0);
      } catch (err) {
        console.error('Order creation failed:', err);
        toast.error(err.response?.data?.message || 'Failed to create order');
      } finally {
        setLoading(false);
      }
    }
  };

  /* ── COD: place order on final step ── */
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

  /* ── Online payment success ── */
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
                style={{ border: '1.5px solid var(--color-primary)',
                         color: 'var(--color-primary)' }}>
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

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-primary)' }} className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/cart"
                className="flex items-center gap-2 text-white/70 text-sm mb-4
                           hover:text-white w-fit">
            <FiArrowLeft size={14} /> Back to Cart
          </Link>
          <h1 className="text-2xl font-semibold text-white"
              style={{ fontFamily: 'var(--font-serif)' }}>Checkout</h1>
          <div className="flex items-center gap-0 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center
                                  text-xs font-bold"
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
                  <div className="w-10 h-px mx-3"
                       style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* STEP 0 — Address */}
            {step === 0 && (
              <div className="bg-white rounded-2xl p-6"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiMapPin size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold"
                      style={{ color: 'var(--color-dark)' }}>Delivery Address</h2>
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
                      <input type={type} name={name}
                        value={address[name]} onChange={handleAddressChange}
                        placeholder={placeholder} className="input text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 — Payment */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <FiCreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold"
                      style={{ color: 'var(--color-dark)' }}>Payment Method</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { value: 'COD',      label: 'Cash on Delivery', sub: 'Pay when your order arrives',        emoji: '💵' },
                    { value: 'Razorpay', label: 'Razorpay',         sub: 'UPI, Cards, Net Banking, Wallets',   emoji: '🇮🇳' },
                    { value: 'Stripe',   label: 'Stripe',           sub: 'International Debit & Credit Cards', emoji: '🌍' },
                  ].map(({ value, label, sub, emoji }) => (
                    <button key={value} type="button" onClick={() => setPayment(value)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left
                                 transition-all duration-200"
                      style={{
                        border: payment === value
                          ? '2px solid var(--color-primary)'
                          : '2px solid var(--color-soft)',
                        backgroundColor: payment === value ? 'var(--color-soft)' : 'white',
                      }}>
                      <span className="text-2xl">{emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold"
                           style={{ color: 'var(--color-dark)' }}>{label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                           style={{
                             borderColor: payment === value
                               ? 'var(--color-primary)' : 'var(--color-soft)',
                             backgroundColor: payment === value
                               ? 'var(--color-primary)' : 'transparent',
                           }}>
                        {payment === value && <FiCheck size={11} color="white" />}
                      </div>
                    </button>
                  ))}
                </div>
                {/* Info per method */}
                <div className="mt-4 p-3 rounded-xl text-xs"
                     style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                  {payment === 'COD' && '💵 Pay with cash when your order arrives.'}
                  {payment === 'Razorpay' && '🇮🇳 Click Continue — Razorpay checkout will open on the next screen.'}
                  {payment === 'Stripe'   && '🌍 Click Continue — Enter your card details on the next screen.'}
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <div className="space-y-4">

                {/* Address summary */}
                <div className="bg-white rounded-2xl p-5"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
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
                <div className="bg-white rounded-2xl p-5"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
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
                  <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                    {payment === 'COD' ? '💵 Cash on Delivery'
                      : payment === 'Razorpay' ? '🇮🇳 Razorpay'
                      : '🌍 Stripe'}
                  </p>
                  {/* Show order ID if created */}
                  {orderId && (
                    <p className="text-xs mt-1 font-mono"
                       style={{ color: 'var(--color-muted)' }}>
                      Order #{orderId.slice(-8).toUpperCase()} ready for payment
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl p-5"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
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
                          <img src={item.image} alt={item.name}
                               className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1"
                             style={{ color: 'var(--color-dark)' }}>{item.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            ₹{item.price} × {item.quantity}
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
                </div>

                {/* ── Razorpay ── */}
                {payment === 'Razorpay' && (
                  <div className="bg-white rounded-2xl p-5"
                       style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-4"
                        style={{ color: 'var(--color-dark)' }}>
                      Complete Payment
                    </h3>
                    {orderId ? (
                      <RazorpayButton
                        amount={grandTotal}
                        orderId={orderId}
                        onSuccess={handlePaymentSuccess}
                      />
                    ) : (
                      <p className="text-sm text-center py-3"
                         style={{ color: 'var(--color-muted)' }}>
                        Setting up payment... please wait.
                      </p>
                    )}
                  </div>
                )}

                {/* ── Stripe ── */}
                {payment === 'Stripe' && orderId && (
                  <div className="bg-white rounded-2xl p-5"
                       style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="text-sm font-semibold mb-4"
                        style={{ color: 'var(--color-dark)' }}>
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

            {/* ── NAVIGATION BUTTONS ── */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => { setStep(s => s - 1); setOrderId(null); }}
                  className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                  style={{ border: '1.5px solid var(--color-soft)',
                           color: 'var(--color-muted)' }}>
                  ← Back
                </button>
              )}

              {/* Steps 0 and 1 — Continue button */}
              {step < 2 && (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5
                             rounded-full text-white text-sm font-medium
                             transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading
                    ? <><Spin /> Preparing order...</>
                    : 'Continue →'}
                </button>
              )}

              {/* Step 2 COD — Place Order button */}
              {step === 2 && payment === 'COD' && (
                <button onClick={handleCOD} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5
                             rounded-full text-white text-sm font-medium transition-all
                             hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading
                    ? <><Spin /> Placing Order...</>
                    : <><FiCheck size={15} /> Place Order (COD)</>}
                </button>
              )}

              {/* Step 2 Razorpay/Stripe — button shown inside review cards above */}
            </div>
          </div>

          {/* RIGHT — Summary */}
          <div>
            <div className="bg-white rounded-2xl p-5 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-sm font-semibold mb-4"
                  style={{ color: 'var(--color-dark)' }}>Order Summary</h3>
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <img src={item.image} className="w-full h-full object-cover" />
                    </div>
                    <p className="flex-1 text-xs line-clamp-1"
                       style={{ color: 'var(--color-dark)' }}>
                      {item.name}
                      <span style={{ color: 'var(--color-muted)' }}> × {item.quantity}</span>
                    </p>
                    <p className="text-xs font-medium shrink-0"
                       style={{ color: 'var(--color-dark)' }}>
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
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Secure checkout
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FiLock size={11} style={{ color: 'var(--color-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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