import api from './api';

/**
 * Fetch the dynamic delivery charge for a given cart subtotal.
 * Returns { charge, label, freeAbove } from the server.
 * Falls back to { charge: 60, label: 'Standard delivery', freeAbove: 999 } on error.
 */
export async function fetchDeliveryCharge(subtotal) {
  try {
    const { data } = await api.get('/delivery/calculate', { params: { subtotal } });
    return data;
  } catch {
    const charge = subtotal >= 999 ? 0 : 60;
    return { charge, label: charge === 0 ? 'Free delivery' : 'Standard delivery', freeAbove: 999 };
  }
}

/**
 * Given a product's comboPrices array and the cart quantity,
 * returns the effective unit price.
 *
 * comboPrices is sorted ascending by quantity (server guarantees this).
 * We pick the highest tier whose `quantity` threshold is met.
 */
export function resolveComboPrice(basePrice, comboPrices = [], quantity = 1) {
  if (!comboPrices?.length) return basePrice;
  let resolved = basePrice;
  for (const tier of comboPrices) {
    if (quantity >= tier.quantity) resolved = tier.price;
  }
  return resolved;
}

/**
 * Return the active combo tier for display (the one currently applied),
 * and the next tier the user could unlock.
 */
export function getComboInfo(basePrice, comboPrices = [], quantity = 1) {
  if (!comboPrices?.length) return { activeTier: null, nextTier: null };

  let activeTier = null;
  let nextTier   = null;

  for (const tier of comboPrices) {
    if (quantity >= tier.quantity) {
      activeTier = tier;
    } else if (!nextTier) {
      nextTier = tier;
    }
  }

  return { activeTier, nextTier };
}

/**
 * Check which cross-product combo offers apply to the current cart.
 * cartItems: [{ productId, variantLabel, quantity, price }]
 */
export async function fetchAppliedComboOffers(cartItems) {
  try {
    const { data } = await api.post('/combo-offers/apply', { cartItems });
    return data; // { appliedOffers, totalSavings }
  } catch {
    return { appliedOffers: [], totalSavings: 0 };
  }
}