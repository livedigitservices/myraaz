const mongoose = require('mongoose');

/**
 * Cross-product combo offer.
 * Example: buy Hair Oil X + Shampoo Y together → pay ₹799 instead of ₹999.
 *
 * `products` — array of product IDs that must ALL be in the cart.
 *   Each entry can optionally require a specific variant (size).
 * `discountType` — 'flat' (₹ off total) | 'percent' (% off total) | 'fixed' (fixed bundle price)
 */
const comboOfferSchema = new mongoose.Schema(
  {
    name:        { type: String,  required: true, trim: true },
    description: { type: String,  default: '' },
    isActive:    { type: Boolean, default: true },

    products: [
      {
        product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variantLabel:  { type: String, default: '' }, // e.g. '100ml' — empty = any size
        quantity:      { type: Number, default: 1, min: 1 },
        _id: false,
      },
    ],

    discountType:  { type: String, enum: ['flat', 'percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    // 'fixed'   → total bundle price in ₹
    // 'flat'    → ₹ off the combined subtotal
    // 'percent' → % off the combined subtotal

    // Optional display badge
    badge: { type: String, default: '' }, // e.g. "Save ₹200", "Bundle Deal"

    validFrom:  { type: Date, default: null },
    validUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComboOffer', comboOfferSchema);