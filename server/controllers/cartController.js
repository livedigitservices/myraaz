const User = require('../models/User.js');

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const existing = user.cart.find(item => item.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/cart/update
const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const item = user.cart.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });
    if (quantity <= 0) {
      user.cart = user.cart.filter(i => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cart/remove/:productId
const removeFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };