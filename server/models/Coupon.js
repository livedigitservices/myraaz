const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  true,
      unique:    true,
      uppercase: true,
      trim:      true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type:    String,
      enum:    ['percent', 'flat'],
      default: 'percent',
    },
    value: {
      type:     Number,
      required: true,
      min:      0,
    },
    minOrder: {
      type:    Number,
      default: 0,
    },
    maxUses: {
      type:    Number,
      default: 0, // 0 = unlimited
    },
    usedCount: {
      type:    Number,
      default: 0,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    showOnBanner: {
      type:    Boolean,
      default: false, // show this coupon on home page banner
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);