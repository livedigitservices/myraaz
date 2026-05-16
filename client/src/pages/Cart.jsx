import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiTrash2, FiMinus, FiPlus,
  FiArrowLeft, FiTag, FiTruck, FiShield, FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';



/* ── Empty cart ── */
const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
         style={{ backgroundColor: 'var(--color-soft)' }}>
      <FiShoppingCart size={36} style={{ color: 'var(--color-muted)' }} />
    </div>
    <h2 className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
      Your cart is empty
    </h2>
    <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--color-muted)' }}>
      Looks like you haven't added anything yet.
      Explore our collection and find something you'll love!
    </p>
    <Link to="/products"
          className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white
                     font-medium text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}>
      <FiArrowLeft size={15} /> Start Shopping
    </Link>
  </div>
);

/* ── Cart Item Row ── */
const CartItem = ({ item, onUpdate, onRemove }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item._id), 300);
  };

  return (
    <div className={`bg-white rounded-2xl p-4 flex gap-4 transition-all duration-300
                     ${removing ? 'opacity-0 scale-95' : 'opacity-100'}`}
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Image */}
      <Link to={`/products/${item._id}`} className="shrink-0">
        <div className="w-24 h-24 rounded-xl overflow-hidden"
             style={{ backgroundColor: 'var(--color-soft)' }}>
          <img src={item.image} alt={item.name}
               className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{item.brand}</p>
            <Link to={`/products/${item._id}`}>
              <h3 className="text-sm font-semibold line-clamp-2 leading-snug hover:underline"
                  style={{ color: 'var(--color-dark)' }}>{item.name}</h3>
            </Link>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs capitalize"
                  style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
              {item.category}
            </span>
          </div>
          {/* Remove */}
          <button onClick={handleRemove}
            className="p-2 rounded-xl transition-all hover:bg-red-50 shrink-0"
            style={{ color: 'var(--color-muted)' }}>
            <FiTrash2 size={15} className="hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Price + Qty */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
          </span>

          {/* Qty stepper */}
          <div className="flex items-center rounded-full overflow-hidden"
               style={{ border: '1.5px solid var(--color-soft)' }}>
            <button onClick={() => onUpdate(item._id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-soft"
              style={{ color: 'var(--color-dark)' }}>
              <FiMinus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-semibold"
                  style={{ color: 'var(--color-dark)' }}>
              {item.quantity}
            </span>
            <button onClick={() => onUpdate(item._id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-dark)' }}>
              <FiPlus size={12} />
            </button>
          </div>
        </div>

        {/* Unit price */}
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          ₹{item.price} per unit
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   CART PAGE
══════════════════════════════════════ */
export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { userInfo } = useAuth();
  const navigate     = useNavigate();

  const [promoInput, setPromoInput]   = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError]   = useState('');

  /* Promo logic */
  const applyPromo = async () => {
  const code = promoInput.trim().toUpperCase();

  if (!code) return;

  try {
    const { data } = await api.post('/coupons/validate', {
      code,
      orderAmount: totalPrice,
    });

    setAppliedPromo({
      code: data.code,
      type: data.type,
      value: data.value,
      label: data.message,
    });

    setPromoError('');
    toast.success(`${data.message} 🎉`);
  } catch (err) {
    setPromoError(
      err.response?.data?.message || 'Invalid promo code'
    );

    setAppliedPromo(null);
  }
};

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    toast.info('Promo code removed');
  };

  /* Price breakdown */
  const shipping       = totalPrice >= 999 ? 0 : 60;
  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? Math.round(totalPrice * appliedPromo.value / 100)
      : appliedPromo.value
    : 0;
  const finalTotal = totalPrice - discountAmount + shipping;
  const savings    = discountAmount + (totalPrice >= 999 ? 60 : 0);

  /* Checkout */
  const handleCheckout = () => {
    if (!userInfo) {
      toast.info('Please login to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { appliedPromo, discountAmount, shipping, finalTotal } });
  };

  /* ── Empty state ── */
  if (cartItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8"
           style={{ backgroundColor: 'var(--color-cream)' }}>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-primary)' }} className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/products"
                className="flex items-center gap-2 text-white/70 text-sm mb-3 hover:text-white transition-colors w-fit">
            <FiArrowLeft size={14} /> Continue Shopping
          </Link>
          <h1 className="text-3xl font-semibold text-white"
              style={{ fontFamily: 'var(--font-serif)' }}>
            My Cart
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── LEFT — Cart Items ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Clear all */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                {cartItems.reduce((s, i) => s + i.quantity, 0)} total items
              </p>
              <button onClick={() => { clearCart(); toast.info('Cart cleared'); }}
                className="text-xs flex items-center gap-1.5 transition-colors hover:text-red-500"
                style={{ color: 'var(--color-muted)' }}>
                <FiTrash2 size={13} /> Clear all
              </button>
            </div>

            {/* Items */}
            {cartItems.map(item => (
              <CartItem
                key={item._id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            {/* Promo code */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-2 mb-3">
                <FiTag size={15} style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                  Promo Code
                </p>
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 rounded-xl"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {appliedPromo.code}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {appliedPromo.label} applied
                    </p>
                  </div>
                  <button onClick={removePromo}
                    className="text-xs font-medium px-3 py-1 rounded-full transition-all"
                    style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="Enter code (e.g. RAAZ20)"
                      className="input flex-1 uppercase text-sm tracking-widest"
                    />
                    <button onClick={applyPromo}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white
                                 transition-all hover:opacity-90 shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs mt-2 text-red-500">{promoError}</p>
                  )}
                  
                </>
              )}
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FiTruck size={16} />,   text: 'Free shipping', sub: 'on orders ₹999+' },
                { icon: <FiShield size={16} />,  text: '100% authentic', sub: 'guaranteed'      },
                { icon: <FiTag size={16} />,     text: 'Best price',    sub: 'always'           },
              ].map(({ icon, text, sub }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 p-3
                                           rounded-2xl text-center bg-white"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>{text}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — Summary ── */}
          <div className="space-y-4">

            {/* Order summary card */}
            <div className="bg-white rounded-2xl p-6 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-base font-semibold mb-5"
                  style={{ color: 'var(--color-dark)' }}>Order Summary</h3>

              {/* Line items */}
              <div className="space-y-3 mb-5">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                         style={{ backgroundColor: 'var(--color-soft)' }}>
                      <img src={item.image} alt={item.name}
                           className="w-full h-full object-cover" />
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

              {/* Divider */}
              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

              {/* Price breakdown */}
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
                  <span style={{ color: 'var(--color-dark)' }}>
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-500 font-medium">Free</span>
                  ) : (
                    <span style={{ color: 'var(--color-dark)' }}>₹{shipping}</span>
                  )}
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">
                      Discount ({appliedPromo.code})
                    </span>
                    <span className="text-green-500 font-medium">
                      − ₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {savings > 0 && (
                  <div className="p-2.5 rounded-xl text-xs font-medium text-center"
                       style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
                    🎉 You're saving ₹{savings.toLocaleString('en-IN')} on this order!
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-semibold" style={{ color: 'var(--color-dark)' }}>Total</span>
                <span className="text-2xl font-semibold"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Checkout CTA */}
              <button onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                           text-white font-medium text-sm transition-all hover:opacity-90
                           active:scale-95"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Proceed to Checkout <FiChevronRight size={16} />
              </button>

              {/* Free shipping nudge */}
              {totalPrice < 999 && (
                <div className="mt-4 p-3 rounded-xl text-center"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Add{' '}
                    <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                      ₹{(999 - totalPrice).toLocaleString('en-IN')}
                    </span>
                    {' '}more for free shipping 🚚
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                       style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{
                           width: `${Math.min((totalPrice / 499) * 100, 100)}%`,
                           backgroundColor: 'var(--color-primary)'
                         }} />
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-5 pt-4"
                   style={{ borderTop: '1px solid var(--color-soft)' }}>
                {['Secure checkout', '100% safe'].map(text => (
                  <div key={text} className="flex items-center gap-1">
                    <FiShield size={11} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested — shop more */}
            <div className="bg-white rounded-2xl p-4 text-center"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
                Want to add more?
              </p>
              <Link to="/products"
                    className="text-sm font-medium flex items-center justify-center gap-1
                               transition-all hover:gap-2"
                    style={{ color: 'var(--color-primary)' }}>
                Browse Products <FiChevronRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}