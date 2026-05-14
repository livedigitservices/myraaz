const Order = require('../models/Order.js');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

// POST /api/orders  (logged in user places order)
const placeOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod,
            itemsPrice, shippingPrice, totalPrice, coupon } = req.body;

    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: 'No items in order' });

    const order = await Order.create({
      user: req.user._id,
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice,coupon,
    });

    // Only clear cart if user has one and is a real Mongoose doc
    try {
      
      await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

      if (coupon?.code) {
  await Coupon.findOneAndUpdate(
    { code: coupon.code.toUpperCase() },
    { $inc: { usedCount: 1 } }
  );
}

    } catch (_) {
      // cart clearing is non-critical, don't fail the order
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('placeOrder error:', err); // ← read this in terminal
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



module.exports = {
  placeOrder, getMyOrders, getAllOrders,
  updateOrderStatus   
};


