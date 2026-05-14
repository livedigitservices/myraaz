const Coupon = require('../models/Coupon');

/* GET /api/coupons/banner — public, returns active banner coupon */
const getBannerCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      isActive:     true,
      showOnBanner: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).sort({ createdAt: -1 });

    res.json(coupon || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/coupons/validate — logged in user validates a coupon */
const validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!coupon)
      return res.status(404).json({ message: 'Invalid coupon code' });
    
  try {
    // const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });
    

    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: 'This coupon has expired' });

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });

    if (coupon.minOrder > 0 && orderAmount < coupon.minOrder)
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrder} required for this coupon`
      });

    // const discount = coupon.type === 'percent'
    //   ? Math.round(orderAmount * coupon.value / 100)
    //   : coupon.value;

    const rawDiscount = coupon.type === 'percent'
  ? Math.round(orderAmount * coupon.value / 100)
  : coupon.value;

const discount = Math.min(rawDiscount, orderAmount);

    res.json({
      valid:       true,
      code:        coupon.code,
      type:        coupon.type,
      value:       coupon.value,
      discount,
      description: coupon.description,
      message:     `${coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`} applied!`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET /api/coupons/admin — admin: get all coupons */
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/coupons/admin — admin: create coupon */
const createCoupon = async (req, res) => {
  try {
    const existing = await Coupon.findOne({ code: req.body.code?.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/coupons/admin/:id — admin: update coupon */
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: 'Coupon not found' });

    Object.assign(coupon, {
      ...req.body,
      code: req.body.code?.toUpperCase() || coupon.code,
    });
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE /api/coupons/admin/:id — admin: delete coupon */
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: 'Coupon not found' });
    await coupon.deleteOne();
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBannerCoupon, validateCoupon,
  getAllCoupons, createCoupon, updateCoupon, deleteCoupon,
};