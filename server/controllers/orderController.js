/**
 * orderController.js
 *
 * Wallet payments are handled atomically inside placeOrder.
 * The paymentController's /payment/wallet route is intentionally removed.
 * Stock decrements and wallet debits both happen in the same request.
 */

const Order   = require('../models/Order.js');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const User    = require('../models/User');
const { debitWallet, refundToWallet } = require('../services/walletService');

/* ─────────────────────────────────────────
   POST /api/orders
   1. Decrement stock atomically per item
   2. If Wallet payment: debit wallet atomically
      (rolls back stock if wallet debit fails)
   3. Create order document
   4. Clear cart + increment coupon usage
───────────────────────────────────────── */
const placeOrder = async (req, res) => {
  const {
    orderItems, shippingAddress, paymentMethod,
    itemsPrice, shippingPrice, totalPrice, coupon,
  } = req.body;

  if (!orderItems || orderItems.length === 0)
    return res.status(400).json({ message: 'No items in order' });

  // ── 1. Decrement stock atomically ──────────────────────────────────────
  const decremented = []; // track what was decremented for rollback

  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      // Rollback already-decremented items before returning error
      for (const d of decremented) {
        await Product.findByIdAndUpdate(d.product, { $inc: { stock: d.quantity } });
      }

      const product = await Product.findById(item.product).select('name stock');
      if (!product)
        return res.status(404).json({ message: `Product not found: ${item.product}` });

      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
      });
    }

    decremented.push({ product: item.product, quantity: item.quantity });
  }

  // ── 2. Handle Wallet payment ───────────────────────────────────────────
  let isPaid        = false;
  let paidAt        = undefined;
  let paymentResult = undefined;

  if (paymentMethod === 'Wallet') {
    try {
      await debitWallet(
        req.user._id,
        totalPrice,
        `Payment for order`,  // orderId not available yet; updated below after order creation
      );

      isPaid        = true;
      paidAt        = new Date();
      paymentResult = {
        id:     `WALLET-${Date.now()}`,
        status: 'paid',
        email:  req.user.email,
      };
    } catch (walletErr) {
      // Wallet debit failed — rollback stock
      for (const d of decremented) {
        await Product.findByIdAndUpdate(d.product, { $inc: { stock: d.quantity } });
      }

      const statusCode = walletErr.statusCode || 500;
      return res.status(statusCode).json({
        message:   walletErr.message,
        available: walletErr.available,
        required:  walletErr.required,
      });
    }
  }

  // ── 3. Create order ────────────────────────────────────────────────────
  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice, coupon,
      isPaid,
      paidAt,
      paymentResult,
      // Wallet orders go straight to processing; others stay pending until paid
      status: isPaid ? 'processing' : 'pending',
    });
  } catch (createErr) {
    // Order creation failed — rollback stock (wallet already debited, so refund it)
    for (const d of decremented) {
      await Product.findByIdAndUpdate(d.product, { $inc: { stock: d.quantity } });
    }
    if (paymentMethod === 'Wallet') {
      await refundToWallet(
        req.user._id,
        totalPrice,
        order?._id || null,
        'Refund: order creation failed'
      ).catch(() => {}); // best-effort refund
    }
    console.error('placeOrder — Order.create failed:', createErr);
    return res.status(500).json({ message: createErr.message });
  }

  // ── 4. Post-order cleanup (non-critical — swallowed individually) ──────
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } }).catch(() => {});

  if (coupon?.code) {
    // Atomic: only increments if the coupon still has uses left,
    // so two concurrent checkouts can't both slip past maxUses.
    await Coupon.findOneAndUpdate(
      {
        code: coupon.code.toUpperCase(),
        $or: [
          { maxUses: 0 },
          { $expr: { $lt: ['$usedCount', '$maxUses'] } },
        ],
      },
      { $inc: { usedCount: 1 } }
    ).catch(() => {});
  }

  res.status(201).json(order);
};

/* ─────────────────────────────────────────
   GET /api/orders/mine
───────────────────────────────────────── */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/orders/admin
───────────────────────────────────────── */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/orders/admin/stats
───────────────────────────────────────── */
const getAdminStats = async (req, res) => {
  try {
    const [totalOrders, pendingOrders, totalProducts, revenueResult, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        require('../models/Product').countDocuments(),
        Order.aggregate([
          { $match: { status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'name email'),
      ]);

    res.json({
      totalOrders,
      pendingOrders,
      totalProducts,
      totalRevenue: revenueResult[0]?.total || 0,
      recentOrders,
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUT /api/orders/admin/:id/status
   On cancellation:
   - Restore stock for every item
   - Refund to wallet for all prepaid methods
───────────────────────────────────────── */
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    const nextStatus = req.body.status;

    order.status = nextStatus;

    // ── Delivered ──────────────────────────────────────────────────────
    if (nextStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      // COD: mark paid on delivery
      if (order.paymentMethod === 'COD' && !order.isPaid) {
        order.isPaid  = true;
        order.paidAt  = Date.now();
        order.paymentResult = {
          id:           `COD-${order._id}`,
          status:       'completed',
          update_time:  new Date().toISOString(),
          email_address: req.user?.email || '',
        };
      }
    }

    // ── Cancelled ──────────────────────────────────────────────────────
    if (nextStatus === 'cancelled' && prevStatus !== 'cancelled') {
      // Restore stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }

      // Refund for all prepaid methods
      const prepaidMethods = ['Wallet', 'Razorpay', 'Stripe', 'UPI'];
      if (order.isPaid && prepaidMethods.includes(order.paymentMethod)) {
        await refundToWallet(
          order.user,
          order.totalPrice,
          order._id,
          `Refund for cancelled order #${order._id.toString().slice(-8).toUpperCase()}`
        ).catch(err => console.error('Cancellation refund to wallet failed:', err.message));
      }
    }

    await order.save();
    res.json(order);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getAdminStats,
  updateOrderStatus,
};