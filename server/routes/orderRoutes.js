const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware.js');
const {
  placeOrder, getMyOrders,
  getAllOrders, updateOrderStatus, getAdminStats
} = require('../controllers/orderController');

router.post('/',                  protect, placeOrder);
router.get('/mine',               protect, getMyOrders);
router.get('/admin',              protect, admin, getAllOrders);
router.get('/admin/stats',        protect, admin, getAdminStats);
router.put('/admin/:id/status',   protect, admin, updateOrderStatus);

module.exports = router;