/**
 * walletRoutes.js
 *
 * Mount this in server.js as:
 *   app.use('/api/wallet', walletRoutes);
 */

const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getMyWallet,
  getWalletByUser,
  adminCreditWallet,
} = require('../controllers/walletController');

// User routes
router.get('/',                  protect,        getMyWallet);      // GET  /api/wallet

// Admin routes
router.get('/admin/:userId',     protect, admin, getWalletByUser);  // GET  /api/wallet/admin/:userId
router.post('/admin/credit',     protect, admin, adminCreditWallet); // POST /api/wallet/admin/credit

module.exports = router;