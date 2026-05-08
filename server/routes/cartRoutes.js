const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController.js');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateCartItem);
router.delete('/remove/:productId', protect, removeFromCart);

module.exports = router;