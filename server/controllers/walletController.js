/**
 * walletController.js
 *
 * Handles all wallet-related HTTP endpoints.
 * Mutations go through walletService — never direct Wallet model writes here.
 */

const { getWallet, creditWallet } = require('../services/walletService');
const Wallet = require('../models/Wallet');

/* ─────────────────────────────────────────
   GET /api/wallet
   Returns the current user's wallet balance + transaction history.
───────────────────────────────────────── */
const getMyWallet = async (req, res) => {
  try {
    const wallet = await getWallet(req.user._id);

    // Return newest transactions first
    const sorted = [...wallet.transactions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      balance:      wallet.balance,
      transactions: sorted,
    });
  } catch (err) {
    console.error('getMyWallet error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/wallet/admin/:userId
   Admin — view any user's wallet.
───────────────────────────────────────── */
const getWalletByUser = async (req, res) => {
  try {
    const wallet = await getWallet(req.params.userId);
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/wallet/admin/credit
   Admin — manually credit a user's wallet (goodwill, compensation, etc.)
   Body: { userId, amount, description }
───────────────────────────────────────── */
const adminCreditWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId)  return res.status(400).json({ message: 'userId is required' });
    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'amount must be a positive number' });

    const wallet = await creditWallet(
      userId,
      Number(amount),
      description || `Admin credit by ${req.user.name || 'admin'}`,
    );

    res.json({ message: `₹${amount} credited successfully`, balance: wallet.balance });
  } catch (err) {
    console.error('adminCreditWallet error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyWallet, getWalletByUser, adminCreditWallet };