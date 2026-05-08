const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getBannerCoupon, validateCoupon,
  getAllCoupons, createCoupon, updateCoupon, deleteCoupon,
} = require('../controllers/couponController');

router.get('/banner',        getBannerCoupon);
router.post('/validate',     protect, validateCoupon);
router.get('/admin',         protect, admin, getAllCoupons);
router.post('/admin',        protect, admin, createCoupon);
router.put('/admin/:id',     protect, admin, updateCoupon);
router.delete('/admin/:id',  protect, admin, deleteCoupon);

module.exports = router;