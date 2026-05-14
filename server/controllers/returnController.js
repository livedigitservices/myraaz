const Order   = require('../models/Order');
const Product = require('../models/Product');

/* ─────────────────────────────────────
   GET /api/returns/eligibility/:orderId
   Check if order items are returnable
───────────────────────────────────── */
const checkEligibility = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    /* Must be delivered */
    if (order.status !== 'delivered')
      return res.json({
        eligible: false,
        message:  'Only delivered orders can be returned',
        items:    [],
      });

    /* Already requested */
    if (order.returnRequest?.requested)
      return res.json({
        eligible:  false,
        message:   'Return already requested',
        existing:  order.returnRequest,
        items:     [],
      });

    /* Fetch all products in the order */
    const productIds = order.orderItems.map(i => i.product).filter(Boolean);
    const products   = await Product.find({ _id: { $in: productIds } });

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);

    /* Check each item */
    const items = order.orderItems.map(item => {
      const product    = productMap[item.product?.toString()];
      const returnable = product?.returnPolicy?.returnable ?? true;
      const returnDays = product?.returnPolicy?.returnDays ?? 7;
      const policyNote = product?.returnPolicy?.description || '';
      const daysSince  = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);
      const daysLeft   = Math.max(0, Math.ceil(returnDays - daysSince));
      const inWindow   = daysSince <= returnDays;

      let eligible = true;
      let reason   = null;

      if (!returnable) {
        eligible = false;
        reason   = policyNote || 'This product is non-returnable';
      } else if (!inWindow) {
        eligible = false;
        reason   = `Return window expired (${returnDays}-day policy)`;
      }

      return {
        name:     item.name,
        image:    item.image,
        price:    item.price,
        quantity: item.quantity,
        eligible,
        reason,
        returnDays,
        daysLeft,
        policyNote,
      };
    });

    const hasEligible = items.some(i => i.eligible);

    res.json({
      eligible:   hasEligible,
      message:    hasEligible
        ? 'Some or all items are eligible for return'
        : 'No items in this order are eligible for return',
      deliveredAt,
      items,
    });
  } catch (err) {
    console.error('Check eligibility error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────
   POST /api/returns/:orderId
   User submits return request
───────────────────────────────────── */
const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason)
      return res.status(400).json({ message: 'Please provide a reason for return' });

    const order = await Order.findById(req.params.orderId);

    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (order.status !== 'delivered')
      return res.status(400).json({ message: 'Only delivered orders can be returned' });

    if (order.returnRequest?.requested)
      return res.status(400).json({ message: 'Return already requested for this order' });

    /* Check eligible items */
    const productIds = order.orderItems.map(i => i.product).filter(Boolean);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);

    const returnableItems    = [];
    const nonReturnableItems = [];

    order.orderItems.forEach(item => {
      const product    = productMap[item.product?.toString()];
      const returnable = product?.returnPolicy?.returnable ?? true;
      const returnDays = product?.returnPolicy?.returnDays ?? 7;
      const daysSince  = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);

      if (!returnable) {
        nonReturnableItems.push(item.name);
      } else if (daysSince > returnDays) {
        nonReturnableItems.push(`${item.name} (window expired)`);
      } else {
        returnableItems.push(item.name);
      }
    });

    if (returnableItems.length === 0)
      return res.status(400).json({
        message: 'No items in this order are eligible for return',
        nonReturnableItems,
      });

    order.returnRequest = {
      requested:          true,
      reason,
      requestedAt:        new Date(),
      status:             'pending',
      returnableItems,
      nonReturnableItems,
    };

    await order.save();

    res.json({
      message: 'Return request submitted successfully',
      order,
    });
  } catch (err) {
    console.error('Request return error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────
   GET /api/returns/admin
   Admin gets all return requests
───────────────────────────────────── */
const getAllReturns = async (req, res) => {
  try {
    const orders = await Order.find({ 'returnRequest.requested': true })
      .populate('user', 'name email phone')
      .sort({ 'returnRequest.requestedAt': -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────
   PUT /api/returns/admin/:orderId
   Admin approves or rejects return
───────────────────────────────────── */
const handleReturn = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected' });

    const order = await Order.findById(req.params.orderId);

    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (!order.returnRequest?.requested)
      return res.status(400).json({ message: 'No return request found' });

    order.returnRequest.status     = status;
    order.returnRequest.resolvedAt = new Date();
    order.returnRequest.adminNote  = adminNote || '';

    if (status === 'approved')
      order.status = 'cancelled';

    await order.save();

    res.json({ message: `Return ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  checkEligibility,
  requestReturn,
  getAllReturns,
  handleReturn,
};