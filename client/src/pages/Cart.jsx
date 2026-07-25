import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiTrash2, FiMinus, FiPlus,
  FiArrowLeft, FiTag, FiTruck, FiShield, FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ── Eyebrow — the flanked-line label used across the site ── */
const Eyebrow = ({ children, light = false }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
    <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
      {children}
    </p>
  </div>
);

/* ── Empty cart ── */
const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-28 text-center">
    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
         style={{ border: '1px solid var(--color-accent)' }}>
      <FiShoppingCart size={30} style={{ color: 'var(--color-accent)' }} />
    </div>
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-accent)' }}>
      Your Bag
    </p>
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
    <div className={`relative bg-white flex gap-4 sm:gap-5 p-4 sm:p-5 transition-all duration-300
                     ${removing ? 'opacity-0 scale-95' : 'opacity-100'}`}
         style={{ boxShadow: 'var(--shadow-card)', borderLeft: '2px solid var(--color-soft)' }}>

      {/* Image */}
      <Link to={`/products/${item._id}`} className="shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 overflow-hidden"
             style={{ backgroundColor: 'var(--color-soft)' }}>
          <img src={item.image} alt={item.name}
               className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-muted)' }}>
              {item.brand}
            </p>
            <Link to={`/products/${item._id}`}>
              <h3 className="text-sm font-semibold line-clamp-2 leading-snug hover:underline"
                  style={{ color: 'var(--color-dark)' }}>{item.name}</h3>
            </Link>
            <span className="inline-block mt-1.5 text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-accent)' }}>
              {item.category}
            </span>
          </div>
          {/* Remove */}
          <button onClick={handleRemove}
            className="p-1.5 transition-all shrink-0"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
            <FiTrash2 size={15} />
          </button>
        </div>

        {/* Price + Qty */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
              ₹{((item.effectivePrice ?? item.price) * item.quantity).toLocaleString('en-IN')}
            </span>
            {item.effectivePrice && item.effectivePrice < item.price && (
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-accent)' }}>
                Combo deal · ₹{item.effectivePrice}/unit
              </p>
            )}
          </div>

          {/* Qty stepper */}
          <div className="flex items-center" style={{ border: '1px solid var(--color-soft)' }}>
            <button onClick={() => onUpdate(item._id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center transition-colors"
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
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
          {item.effectivePrice && item.effectivePrice < item.price
            ? <><s>₹{item.price}</s> → ₹{item.effectivePrice} per unit</>
            : `₹${item.price} per unit`}
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

  const [promoInput, setPromoInput]     = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError]     = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ charge: 60, label: 'Standard delivery', freeAbove: 999 });
  const [comboOffers, setComboOffers]   = useState([]); // [{ offer, savings, finalPrice }]
  const comboSavings = comboOffers.reduce((s, o) => s + o.savings, 0);

  /* Fetch dynamic delivery charge whenever subtotal changes */
  useEffect(() => {
    let cancelled = false;
    import('../services/deliveryService').then(({ fetchDeliveryCharge }) => {
      fetchDeliveryCharge(totalPrice).then(info => {
        if (!cancelled) setDeliveryInfo(info);
      });
    });
    return () => { cancelled = true; };
  }, [totalPrice]);

  /* Check applicable cross-product combo offers */
  useEffect(() => {
    if (!cartItems.length) { setComboOffers([]); return; }
    let cancelled = false;
    const cartPayload = cartItems.map(i => ({
      productId:    i._id,
      variantLabel: i.selectedVariantLabel || '',
      quantity:     i.quantity,
      price:        i.effectivePrice ?? i.price,
    }));
    api.post('/combo-offers/apply', { cartItems: cartPayload })
      .then(({ data }) => { if (!cancelled) setComboOffers(data.appliedOffers || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cartItems]);

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
  const shipping       = deliveryInfo.charge;
  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? Math.round(totalPrice * appliedPromo.value / 100)
      : appliedPromo.value
    : 0;
  const totalDiscount = discountAmount + comboSavings;
  const finalTotal    = totalPrice - totalDiscount + shipping;
  const savings       = totalDiscount + (shipping === 0 ? 60 : 0);

  /* Checkout */
  const handleCheckout = () => {
    if (!userInfo) {
      toast.info('Please login to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { appliedPromo, discountAmount: totalDiscount, shipping, finalTotal } });
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

      {/* Header — dark editorial band, matches Products/Perks/Footer */}
      <div className="relative overflow-hidden py-12 md:py-16" style={{ backgroundColor: 'var(--color-dark)' }}>
        <div className="absolute inset-0 opacity-[0.05]"
             style={{
               backgroundImage: `url(https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1600&q=60)`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }} />
        <div className="absolute inset-0"
             style={{ background: 'radial-gradient(ellipse at center, transparent 0%, var(--color-dark) 85%)' }} />

        <div className="relative max-w-6xl mx-auto px-4">
          <Link to="/products"
                className="flex items-center gap-2 text-sm mb-5 transition-colors w-fit"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
            <FiArrowLeft size={14} /> Continue Shopping
          </Link>
          <div className="flex items-center gap-2.5 mb-3">
            <span style={{ width: '24px', height: '1px', backgroundColor: 'var(--color-accent)' }} />
            <p className="text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>
              Your Bag
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white"
              style={{ fontFamily: 'var(--font-serif)' }}>
            My Cart
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT — Cart Items ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Clear all */}
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--color-muted)' }}>
                {cartItems.reduce((s, i) => s + i.quantity, 0)} total items
              </p>
              <button onClick={() => { clearCart(); toast.info('Cart cleared'); }}
                className="text-xs flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                <FiTrash2 size={13} /> Clear all
              </button>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {cartItems.map(item => (
                <CartItem
                  key={item._id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            {/* Promo code */}
            <div className="bg-white p-6" style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
              <div className="flex items-center gap-2 mb-4">
                <FiTag size={14} style={{ color: 'var(--color-accent)' }} />
                <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-dark)' }}>
                  Promo Code
                </p>
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between p-3.5"
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
                    className="text-xs font-medium px-3 py-1.5 transition-all"
                    style={{ color: 'var(--color-dark)', border: '1px solid var(--color-dark)' }}>
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
                      className="flex-1 uppercase text-sm tracking-widest px-3 py-2.5 bg-transparent focus:outline-none"
                      style={{ border: '1px solid var(--color-soft)', color: 'var(--color-dark)' }}
                    />
                    <button onClick={applyPromo}
                      className="px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white
                                 transition-all hover:opacity-90 shrink-0"
                      style={{ backgroundColor: 'var(--color-dark)' }}>
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
            <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-soft)' }}>
              {[
                { icon: <FiTruck size={17} />,   text: 'Free shipping', sub: `on orders ₹${deliveryInfo.freeAbove}+` },
                { icon: <FiShield size={17} />,  text: '100% authentic', sub: 'guaranteed'      },
                { icon: <FiTag size={17} />,     text: 'Best price',    sub: 'always'           },
              ].map(({ icon, text, sub }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 py-5 px-2 text-center bg-white">
                  <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>{text}</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — Summary ── */}
          <div className="space-y-4">

            {/* Order summary card */}
            <div className="bg-white p-6 sticky top-24"
                 style={{ boxShadow: 'var(--shadow-card)', borderTop: '2px solid var(--color-accent)' }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] mb-5"
                 style={{ color: 'var(--color-dark)' }}>Order Summary</p>

              {/* Line items */}
              <div className="space-y-3 mb-5">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-8 h-8 overflow-hidden shrink-0"
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
                      ₹{((item.effectivePrice ?? item.price) * item.quantity).toLocaleString('en-IN')}
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
                    <span className="font-medium" style={{ color: 'var(--color-accent)' }}>Free</span>
                  ) : (
                    <span style={{ color: 'var(--color-dark)' }}>₹{shipping}</span>
                  )}
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-accent)' }}>
                      Discount ({appliedPromo.code})
                    </span>
                    <span className="font-medium" style={{ color: 'var(--color-accent)' }}>
                      − ₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Combo offer savings */}
                {comboOffers.map((co, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate mr-2" style={{ color: 'var(--color-accent)' }}>
                      🎁 {co.offer.name}
                      {co.offer.badge ? ` · ${co.offer.badge}` : ''}
                    </span>
                    <span className="font-medium shrink-0" style={{ color: 'var(--color-accent)' }}>
                      − ₹{co.savings.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                {savings > 0 && (
                  <div className="p-3 text-xs font-medium text-center"
                       style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
                    🎉 You're saving ₹{savings.toLocaleString('en-IN')} on this order!
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--color-dark)' }}>Total</span>
                <span className="text-2xl font-semibold"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Checkout CTA */}
              <button onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5
                           text-white font-medium text-sm uppercase tracking-wider transition-all hover:opacity-90
                           active:scale-[0.99]"
                style={{ backgroundColor: 'var(--color-dark)' }}>
                Proceed to Checkout <FiChevronRight size={16} />
              </button>

              {/* Free shipping nudge */}
              {shipping > 0 && totalPrice < deliveryInfo.freeAbove && (
                <div className="mt-4 p-3.5 text-center" style={{ backgroundColor: 'var(--color-soft)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Add{' '}
                    <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                      ₹{(deliveryInfo.freeAbove - totalPrice).toLocaleString('en-IN')}
                    </span>
                    {' '}more for free shipping 🚚
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2.5 h-1 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>
                    <div className="h-full transition-all duration-500"
                         style={{
                           width: `${Math.min((totalPrice / deliveryInfo.freeAbove) * 100, 100)}%`,
                           backgroundColor: 'var(--color-accent)'
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
            <div className="bg-white p-5 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
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