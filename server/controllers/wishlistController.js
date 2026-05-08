const User = require('../models/User.js');

// GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/wishlist/add
const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Already in wishlist' });
    }
    user.wishlist.push(productId);
    await user.save();
    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/wishlist/remove/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== req.params.productId
    );
    await user.save();
    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };