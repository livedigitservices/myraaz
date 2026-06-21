const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { calculateDelivery, getConfig, saveConfig } = require('../controllers/deliveryController');

router.get('/calculate',  calculateDelivery);           // public
router.get('/config',     protect, admin, getConfig);   // admin
router.put('/config',     protect, admin, saveConfig);  // admin

module.exports = router;