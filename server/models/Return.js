const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:     String,
  image:    String,
  price:    Number,
  quantity: Number,
  reason:   String,
});

const returnSchema = new mongoose.Schema({
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

  /* Items being returned */
  returnItems:     [returnItemSchema],
  nonReturnItems:  [{ name: String, reason: String }],

  /* Return details */
  reason:       { type: String, required: true },
  description:  { type: String, default: '' },
  images:       [String], // proof images

  /* Status flow */
  status: {
    type:    String,
    enum:    ['pending', 'approved', 'rejected', 'refund_initiated', 'refund_completed', 'refund_failed'],
    default: 'pending',
  },

  /* Refund details */
  refundMethod: {
    type: String,
    enum: ['wallet', 'original_payment', 'upi', 'bank'],
    default: 'wallet',
  },
  refundAmount:    { type: Number, default: 0 },
  partialRefund:   { type: Boolean, default: false },

  /* UPI/Bank for COD refunds */
  upiId:       String,
  bankDetails: {
    accountNumber: String,
    ifsc:          String,
    accountName:   String,
  },

  /* Admin */
  adminNote:   { type: String, default: '' },
  resolvedAt:  Date,
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  /* Gateway refund tracking */
  gatewayRefundId: String,
  webhookEvents:   [{ event: String, data: Object, receivedAt: Date }],

  /* Fraud flags */
  fraudFlags: [{
    type:   String,
    reason: String,
    flaggedAt: Date,
  }],
  requiresManualReview: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);