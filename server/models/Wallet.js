const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type:        { type: String, enum: ['credit', 'debit'], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, required: true },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  refundId:    { type: String },
  status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:      { type: Number, default: 0, min: 0 },
  transactions: [transactionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);