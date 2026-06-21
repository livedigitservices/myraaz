const DeliveryConfig = require('../models/DeliveryConfig');

/* ─────────────────────────────────────────
   Shared helper — pure function, no DB call needed.
   Pass the config doc and a subtotal; returns { charge, label }.
───────────────────────────────────────── */
const computeCharge = (config, subtotal) => {
  for (const rule of config.rules) {
    const aboveMin = subtotal >= rule.minOrderValue;
    const belowMax = rule.maxOrderValue === null || subtotal < rule.maxOrderValue;
    if (aboveMin && belowMax) {
      return { charge: rule.charge, label: rule.label };
    }
  }
  // Fallback: free above threshold, else default charge
  if (subtotal >= config.freeAbove) return { charge: 0, label: 'Free delivery' };
  return { charge: config.defaultCharge, label: 'Standard delivery' };
};

/* ─────────────────────────────────────────
   GET /api/delivery/calculate?subtotal=<n>
   Public — called by Cart/Checkout to show live shipping fee.
───────────────────────────────────────── */
const calculateDelivery = async (req, res) => {
  const subtotal = Number(req.query.subtotal);
  if (isNaN(subtotal) || subtotal < 0)
    return res.status(400).json({ message: 'Invalid subtotal' });

  const config = await DeliveryConfig.findOne({ singleton: 'default' });
  if (!config) {
    // No config yet — use safe defaults
    const charge = subtotal >= 999 ? 0 : 60;
    return res.json({ charge, label: charge === 0 ? 'Free delivery' : 'Standard delivery', freeAbove: 999 });
  }

  const result = computeCharge(config, subtotal);
  res.json({ ...result, freeAbove: config.freeAbove });
};

/* ─────────────────────────────────────────
   GET /api/delivery/config
   Admin — fetch current config.
───────────────────────────────────────── */
const getConfig = async (req, res) => {
  const config = await DeliveryConfig.findOne({ singleton: 'default' });
  res.json(config || { rules: [], defaultCharge: 60, freeAbove: 999 });
};

/* ─────────────────────────────────────────
   PUT /api/delivery/config
   Admin — save/replace config.
   Body: { rules: [...], defaultCharge: 60, freeAbove: 999 }
───────────────────────────────────────── */
const saveConfig = async (req, res) => {
  const { rules = [], defaultCharge = 60, freeAbove = 999 } = req.body;

  // Validate rules
  for (const rule of rules) {
    if (!rule.label?.trim())          return res.status(400).json({ message: 'Each rule needs a label' });
    if (typeof rule.charge !== 'number' || rule.charge < 0)
      return res.status(400).json({ message: 'Charge must be a non-negative number' });
    if (typeof rule.minOrderValue !== 'number')
      return res.status(400).json({ message: 'minOrderValue is required' });
  }

  const config = await DeliveryConfig.findOneAndUpdate(
    { singleton: 'default' },
    { rules, defaultCharge: Number(defaultCharge), freeAbove: Number(freeAbove) },
    { upsert: true, new: true, runValidators: true }
  );

  res.json(config);
};

module.exports = { calculateDelivery, getConfig, saveConfig, computeCharge };