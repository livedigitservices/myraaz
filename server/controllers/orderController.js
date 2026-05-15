const Order   = require('../models/Order.js');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const User    = require('../models/User');
const Wallet  = require('../models/Wallet');

/* ─────────────────────────────────────────
   POST /api/orders
   Place order + decrement stock atomically
───────────────────────────────────────── */
const placeOrder = async (req, res) => {
  try {
    const {
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice, coupon,
    } = req.body;

    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: 'No items in order' });

    // ── 1. Decrement stock atomically ──────────────────────────────────
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        const product = await Product.findById(item.product).select('name stock');
        if (!product)
          return res.status(404).json({ message: `Product not found: ${item.product}` });

        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        });
      }
    }

    // ── 2. Handle Wallet payment ───────────────────────────────────────
    let isPaid    = false;
    let paidAt    = undefined;
    let paymentResult = undefined;

    if (paymentMethod === 'Wallet') {
      const wallet = await Wallet.findOne({ user: req.user._id });

      if (!wallet || wallet.balance < totalPrice) {
        // Rollback stock decrements
        for (const item of orderItems) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      wallet.balance -= totalPrice;
      wallet.transactions.push({
        type:        'debit',
        amount:      totalPrice,
        description: 'Order payment via Wallet',
        status:      'completed',
      });
      await wallet.save();

      isPaid    = true;
      paidAt    = new Date();
      paymentResult = { id: `WALLET-${Date.now()}`, status: 'completed' };
    }

    // ── 3. Create order ────────────────────────────────────────────────
    const order = await Order.create({
      user: req.user._id,
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice, coupon,
      isPaid, paidAt, paymentResult,
    });

    // ── 4. Post-order cleanup (non-critical) ───────────────────────────
    try {
      await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

      if (coupon?.code) {
        await Coupon.findOneAndUpdate(
          { code: coupon.code.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      }
    } catch (_) {
      // intentionally swallowed — order already created
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('placeOrder error:', err);
    res.status(500).json({ message: err.message });
  }
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
        Product.countDocuments(),
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
───────────────────────────────────────── */
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    const nextStatus = req.body.status;

    order.status = nextStatus;

    // ── Mark as delivered ──────────────────────────────────────────────
    if (nextStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      // COD: mark paid on delivery
      if (order.paymentMethod === 'COD' && !order.isPaid) {
        order.isPaid  = true;
        order.paidAt  = Date.now();
        order.paymentResult = {
          id:            `COD-${order._id}`,
          status:        'completed',
          update_time:   new Date().toISOString(),
          email_address: '',
        };
      }
    }

    // ── Cancellation: restore stock + refund wallet if applicable ──────
    if (nextStatus === 'cancelled' && prevStatus !== 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }

      // Refund to wallet if paid via Wallet (or prepaid methods)
      if (order.isPaid && ['Wallet', 'Razorpay', 'Stripe', 'UPI'].includes(order.paymentMethod)) {
        await Wallet.findOneAndUpdate(
          { user: order.user },
          {
            $inc: { balance: order.totalPrice },
            $push: {
              transactions: {
                type:        'credit',
                amount:      order.totalPrice,
                description: `Refund for cancelled order #${order._id}`,
                orderId:     order._id,
                status:      'completed',
              },
            },
          },
          { upsert: true }
        );
      }
    }

    await order.save();
    res.json(order);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, getAdminStats, updateOrderStatus };