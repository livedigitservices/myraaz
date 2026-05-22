// routes/homeFeaturedRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getFeatured, setFeatured } = require('../controllers/homeFeaturedController');

router.get('/',        getFeatured);
router.put('/admin',   protect, admin, setFeatured);

module.exports = router;