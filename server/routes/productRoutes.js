const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const { protect, admin }  = require('../middleware/authMiddleware');
const { upload }          = require('../config/cloudinary');
const {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct
} = require('../controllers/productController');

router.get('/',    getProducts);
router.get('/:id', getProductById);

/* Use upload.array for multiple images (max 4) */
router.post('/admin',       protect, admin, upload.array('images', 4), createProduct);
router.put('/admin/:id',    protect, admin, upload.array('images', 4), updateProduct);
router.delete('/admin/:id', protect, admin, deleteProduct);

/* Review route */
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed)
      return res.status(400).json({ message: 'You already reviewed this product' });
    const review = {
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(req.body.rating),
      comment: req.body.comment,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;