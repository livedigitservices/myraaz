const Coupon = require('../models/Coupon');

/* ─────────────────────────────────────────
   GET /api/coupons/banner
   Public — returns the active banner coupon.
   Uses $gte so a coupon expiring today still shows.
───────────────────────────────────────── */
const getBannerCoupon = async (req, res) => {
  try {
    const now = new Date();
    // Zero out time so "expires today" coupons still appear all day
    now.setHours(0, 0, 0, 0);

    const coupon = await Coupon.findOne({
      isActive:     true,
      showOnBanner: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: now } },   //  $gte not $gt — includes today
      ],
    }).sort({ createdAt: -1 });

    res.json(coupon || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/coupons/validate
   Authenticated user validates a coupon code.
   Body: { code, orderAmount }
───────────────────────────────────────── */
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code)
      return res.status(400).json({ message: 'Coupon code is required' });

    if (!orderAmount || orderAmount <= 0)
      return res.status(400).json({ message: 'Valid order amount is required' });

    //  Query FIRST, then check result — was inverted before
    const coupon = await Coupon.findOne({
      code:     code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon)
      return res.status(404).json({ message: 'Invalid coupon code' });

    // Expiry — use $gte logic: expired if expiresAt is before start of today
    if (coupon.expiresAt) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (new Date(coupon.expiresAt) < now)
        return res.status(400).json({ message: 'This coupon has expired' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });

    if (coupon.minOrder > 0 && orderAmount < coupon.minOrder)
      return res.status(400).json({
        message: `Minimum order of ₹${coupon.minOrder} required for this coupon`,
      });

    const rawDiscount = coupon.type === 'percent'
      ? Math.round(orderAmount * coupon.value / 100)
      : coupon.value;

    const discount = Math.min(rawDiscount, orderAmount); // never exceed order total

    res.json({
      valid:       true,
      code:        coupon.code,
      type:        coupon.type,
      value:       coupon.value,
      discount,
      description: coupon.description,
      message:     coupon.type === 'percent'
        ? `${coupon.value}% off applied!`
        : `₹${coupon.value} off applied!`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/coupons/admin
───────────────────────────────────────── */
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/coupons/admin
───────────────────────────────────────── */
const createCoupon = async (req, res) => {
  try {
    const code = req.body.code?.trim().toUpperCase();
    if (!code)
      return res.status(400).json({ message: 'Coupon code is required' });

    const existing = await Coupon.findOne({ code });
    if (existing)
      return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create({ ...req.body, code });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUT /api/coupons/admin/:id
───────────────────────────────────────── */
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: 'Coupon not found' });

    Object.assign(coupon, {
      ...req.body,
      code: req.body.code?.trim().toUpperCase() || coupon.code,
    });
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE /api/coupons/admin/:id
───────────────────────────────────────── */
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
  getBannerCoupon,
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};