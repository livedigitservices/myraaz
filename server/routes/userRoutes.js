const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware.js');
const {
  getUserProfile, updateUserProfile,
  getAllUsers, deleteUser, toggleAdmin
} = require('../controllers/userController');

router.get('/profile',              protect, getUserProfile);
router.put('/profile',              protect, updateUserProfile);
router.get('/admin',                protect, admin, getAllUsers);
router.delete('/admin/:id',         protect, admin, deleteUser);
router.put('/admin/:id/toggle-admin', protect, admin, toggleAdmin);

module.exports = router;