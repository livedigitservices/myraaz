const mongoose = require('mongoose');

/**
 * DeliveryConfig — single-document config (upserted by admin).
 *
 * Rules are evaluated top-to-bottom; first match wins.
 * Each rule has:
 *   minOrderValue  — cart subtotal must be ≥ this
 *   maxOrderValue  — cart subtotal must be < this (null = no upper bound)
 *   charge         — delivery fee in ₹ (0 = free)
 *   label          — shown to the customer ("Free", "Standard", etc.)
 */
const ruleSchema = new mongoose.Schema(
  {
    label:         { type: String,  required: true },
    minOrderValue: { type: Number,  required: true, default: 0    },
    maxOrderValue: { type: Number,  default: null                 }, // null = ∞
    charge:        { type: Number,  required: true, default: 0    },
  },
  { _id: false }
);

const deliveryConfigSchema = new mongoose.Schema(
  {
    // Only one document lives in this collection.
    singleton: { type: String, default: 'default', unique: true },
    rules:     { type: [ruleSchema], default: [] },
    // Fallback if no rule matches
    defaultCharge: { type: Number, default: 60 },
    freeAbove:     { type: Number, default: 999 }, // convenience field for the nudge UI
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryConfig', deliveryConfigSchema);