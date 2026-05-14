

const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  placeOrder, getMyOrders, getAllOrders,
  updateOrderStatus 
  
} = require('../controllers/orderController');

router.post('/',                        protect,       placeOrder);
router.get('/mine',                     protect,       getMyOrders);
router.get('/admin',                    protect, admin, getAllOrders);
// router.get('/admin/stats',              protect, admin, getAdminStats);
// router.get('/admin/returns',            protect, admin, getReturnRequests);
router.put('/admin/:id/status',         protect, admin, updateOrderStatus);

module.exports = router;