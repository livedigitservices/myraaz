const Order = require('../models/Order.js');

// POST /api/orders  (logged in user places order)
const placeOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod,
            itemsPrice, shippingPrice, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: 'No items in order' });

    const order = await Order.create({
      user: req.user._id,
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice,
    });

    // Clear cart after placing order
    req.user.cart = [];
    await req.user.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/mine  (user's own orders)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/admin  (admin: all orders)
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

// PUT /api/orders/admin/:id/status  (admin: update order status)
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = req.body.status;
    if (req.body.status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/admin/stats  (admin dashboard numbers)
const getAdminStats = async (req, res) => {
  try {
    const totalOrders    = await Order.countDocuments();
    const pendingOrders  = await Order.countDocuments({
      status: { $in: ['pending', 'processing'] }
    });

    // ✅ Only count revenue from DELIVERED orders
    const revenueResult  = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const totalProducts  = await require('../models/Product').countDocuments();

    const recentOrders   = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalOrders,
      totalRevenue:  revenueResult[0]?.total || 0,
      pendingOrders,
      totalProducts,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, getAdminStats };