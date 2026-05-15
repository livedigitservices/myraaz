const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getAdminStats,
  updateOrderStatus,
} = require('../controllers/orderController');

router.post('/',                    protect,        placeOrder);
router.get('/mine',                 protect,        getMyOrders);
router.get('/admin/stats',          protect, admin, getAdminStats);    // ← must be ABOVE /admin/:id
router.get('/admin',                protect, admin, getAllOrders);
router.put('/admin/:id/status',     protect, admin, updateOrderStatus);

module.exports = router;