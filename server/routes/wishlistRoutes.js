const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController.js');

router.get('/', protect, getWishlist);
router.post('/add', protect, addToWishlist);
router.delete('/remove/:productId', protect, removeFromWishlist);

module.exports = router;