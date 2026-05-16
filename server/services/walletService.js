/**
 * walletService.js
 *
 * Single source of truth for ALL wallet operations.
 * Every debit/credit goes through here — never touch Wallet directly elsewhere.
 *
 * All mutating functions use findOneAndUpdate with atomic $inc so concurrent
 * requests can't produce a negative balance or a double-deduction.
 */

const mongoose = require('mongoose');
const Wallet   = require('../models/Wallet');

/* ─────────────────────────────────────────
   getWallet
   Returns the wallet for a user, creating one
   if it doesn't exist yet (upsert).
───────────────────────────────────────── */
const getWallet = async (userId) => {
  const wallet = await Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, balance: 0, transactions: [] } },
    { upsert: true, new: true }
  );
  return wallet;
};

/* ─────────────────────────────────────────
   creditWallet
   Adds funds to a wallet atomically.
   Safe to call from refunds, admin top-ups, etc.
───────────────────────────────────────── */
const creditWallet = async (userId, amount, description, orderId = null) => {
  if (amount <= 0) throw new Error('Credit amount must be positive');

  const transaction = {
    type:        'credit',
    amount,
    description,
    status:      'completed',
    ...(orderId && { orderId }),
  };

  const wallet = await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc:  { balance: amount },
      $push: { transactions: transaction },
      $setOnInsert: { user: userId },
    },
    { upsert: true, new: true }
  );

  return wallet;
};

/* ─────────────────────────────────────────
   debitWallet
   Atomically deducts amount ONLY if balance >= amount.
   Throws a structured error if insufficient — never goes negative.
───────────────────────────────────────── */
const debitWallet = async (userId, amount, description, orderId = null) => {
  if (amount <= 0) throw new Error('Debit amount must be positive');

  const transaction = {
    type:        'debit',
    amount,
    description,
    status:      'completed',
    ...(orderId && { orderId }),
  };

  // Atomic: only update if balance will stay >= 0
  const wallet = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: amount } },
    {
      $inc:  { balance: -amount },
      $push: { transactions: transaction },
    },
    { returnDocument: 'after'}
  );

  if (!wallet) {
    // Either wallet doesn't exist or balance was insufficient
    const existing = await Wallet.findOne({ user: userId });
    const balance  = existing?.balance ?? 0;
    const err      = new Error('Insufficient wallet balance');
    err.statusCode = 400;
    err.available  = balance;
    err.required   = amount;
    throw err;
  }

  return wallet;
};

/* ─────────────────────────────────────────
   refundToWallet
   Used by returnController when a return is approved.
   Credits the refund amount and records the orderId reference.
───────────────────────────────────────── */
const refundToWallet = async (userId, amount, orderId, description) => {
  return creditWallet(
    userId,
    amount,
    description || `Refund for order #${orderId?.toString().slice(-8).toUpperCase()}`,
    orderId
  );
};

module.exports = { getWallet, creditWallet, debitWallet, refundToWallet };