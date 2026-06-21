const ComboOffer = require('../models/ComboOffer');

/* ── List all (admin: all, public: active only) ── */
const getComboOffers = async (req, res) => {
  const filter = req.user?.isAdmin ? {} : { isActive: true };
  const offers = await ComboOffer.find(filter)
    .populate('products.product', 'name image price category variants');
  res.json(offers);
};

/* ── Single offer ── */
const getComboOfferById = async (req, res) => {
  const offer = await ComboOffer.findById(req.params.id)
    .populate('products.product', 'name image price category variants');
  if (!offer) return res.status(404).json({ message: 'Combo offer not found' });
  res.json(offer);
};

/* ── Create (admin) ── */
const createComboOffer = async (req, res) => {
  const { name, description, products, discountType, discountValue, badge, validFrom, validUntil } = req.body;

  if (!products?.length || products.length < 2)
    return res.status(400).json({ message: 'A combo offer needs at least 2 products' });

  const offer = await ComboOffer.create({
    name, description, products, discountType, discountValue,
    badge, validFrom: validFrom || null, validUntil: validUntil || null,
  });

  const populated = await offer.populate('products.product', 'name image price category variants');
  res.status(201).json(populated);
};

/* ── Update (admin) ── */
const updateComboOffer = async (req, res) => {
  const offer = await ComboOffer.findById(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Combo offer not found' });

  const fields = ['name','description','products','discountType','discountValue','badge','isActive','validFrom','validUntil'];
  fields.forEach(f => { if (req.body[f] !== undefined) offer[f] = req.body[f]; });

  await offer.save();
  const populated = await offer.populate('products.product', 'name image price category variants');
  res.json(populated);
};

/* ── Delete (admin) ── */
const deleteComboOffer = async (req, res) => {
  const offer = await ComboOffer.findByIdAndDelete(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Combo offer not found' });
  res.json({ message: 'Combo offer deleted' });
};

/**
 * POST /api/combo-offers/apply
 * Body: { cartItems: [{ productId, variantLabel, quantity, price }] }
 * Returns: { appliedOffers: [{ offer, savings, finalPrice }] }
 *
 * Computes which active combo offers apply to the given cart
 * and returns the total savings.
 */
const applyComboOffers = async (req, res) => {
  const { cartItems = [] } = req.body;
  if (!cartItems.length) return res.json({ appliedOffers: [], totalSavings: 0 });

  const now = new Date();
  const activeOffers = await ComboOffer.find({
    isActive: true,
    $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
  }).populate('products.product', 'name image price category variants');

  const validOffers = activeOffers.filter(o =>
    !o.validUntil || o.validUntil >= now
  );

  const appliedOffers = [];

  for (const offer of validOffers) {
    // Check if every required product (+ optional variantLabel) is in the cart
    const allPresent = offer.products.every(req => {
      const cartItem = cartItems.find(ci => {
        const idMatch = String(ci.productId) === String(req.product._id);
        if (!idMatch) return false;
        if (!req.variantLabel) return true; // any size accepted
        return ci.variantLabel === req.variantLabel;
      });
      return !!cartItem && cartItem.quantity >= req.quantity;
    });

    if (!allPresent) continue;

    // Compute subtotal of the combo products in cart
    const comboSubtotal = offer.products.reduce((sum, req) => {
      const ci = cartItems.find(ci => String(ci.productId) === String(req.product._id));
      return sum + (ci ? ci.price * req.quantity : 0);
    }, 0);

    let savings = 0;
    let finalPrice = comboSubtotal;

    if (offer.discountType === 'fixed') {
      savings    = Math.max(0, comboSubtotal - offer.discountValue);
      finalPrice = offer.discountValue;
    } else if (offer.discountType === 'flat') {
      savings    = Math.min(offer.discountValue, comboSubtotal);
      finalPrice = comboSubtotal - savings;
    } else if (offer.discountType === 'percent') {
      savings    = Math.round(comboSubtotal * offer.discountValue / 100);
      finalPrice = comboSubtotal - savings;
    }

    appliedOffers.push({ offer, savings, finalPrice, comboSubtotal });
  }

  const totalSavings = appliedOffers.reduce((s, o) => s + o.savings, 0);
  res.json({ appliedOffers, totalSavings });
};

module.exports = { getComboOffers, getComboOfferById, createComboOffer, updateComboOffer, deleteComboOffer, applyComboOffers };