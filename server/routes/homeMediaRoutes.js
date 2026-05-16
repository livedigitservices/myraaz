const express  = require('express');
const router   = express.Router();
const { protect, admin }   = require('../middleware/authMiddleware');
const { uploadHomeMedia }  = require('../config/cloudinary');
const {
  getHomeMedia,
  getHomeMediaAdmin,
  createHomeMedia,
  updateHomeMedia,
  deleteHomeMedia,
} = require('../controllers/homeMediaController');

// Public
router.get('/',              getHomeMedia);

// Admin
router.get('/admin',         protect, admin, getHomeMediaAdmin);
router.post('/admin',        protect, admin, uploadHomeMedia.single('file'), createHomeMedia);
router.put('/admin/:id',     protect, admin, updateHomeMedia);
router.delete('/admin/:id',  protect, admin, deleteHomeMedia);

module.exports = router;