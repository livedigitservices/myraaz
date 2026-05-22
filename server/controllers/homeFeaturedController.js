// controllers/homeFeaturedController.js
const HomeFeatured = require('../models/HomeFeaturedProduct');

// GET /api/home-featured  — public
const getFeatured = async (req, res) => {
  try {
    const doc = await HomeFeatured.findOne().sort({ createdAt: -1 }).populate('product');
    res.json(doc ? doc.product : null);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/home-featured/admin  — admin
const setFeatured = async (req, res) => {
  try {
    const { productId } = req.body;
    await HomeFeatured.deleteMany({});
    const doc = await HomeFeatured.create({ product: productId });
    await doc.populate('product');
    res.json(doc.product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getFeatured, setFeatured };