const User = require('../models/User.js');


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      _id:         user._id,
      name:        user.name,
      email:       user.isPhoneUser ? '' : user.email,
      phone:       user.phone,
      isAdmin:     user.isAdmin,
      isPhoneUser: user.isPhoneUser,
      defaultAddress: user.defaultAddress,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.name  = req.body.name  || user.name;
    user.phone = req.body.phone || user.phone;

    /* Only update email if provided and not a placeholder */
    if (req.body.email && !req.body.email.includes('@placeholder.com')) {
      const normalizedEmail = req.body.email.toLowerCase().trim();

      /* Check email not taken by another user */
      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id:   { $ne: user._id },
      });
      if (emailExists)
        return res.status(400).json({ message: 'Email already in use' });

      user.email       = normalizedEmail;
      user.isPhoneUser = false; // now has real email
    }

    if (req.body.password) user.password = req.body.password;

    if (req.body.defaultAddress) {
      user.defaultAddress = req.body.defaultAddress;
    }

    const updated = await user.save();

    res.json({
      _id:         updated._id,
      name:        updated.name,
      email:       updated.isPhoneUser ? '' : updated.email,
      phone:       updated.phone,
      isAdmin:     updated.isAdmin,
      isPhoneUser: updated.isPhoneUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/admin  (admin: list all users)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/admin/:id  (admin: delete user)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/admin/:id/toggle-admin  (admin: make/remove admin)
const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ message: `User is now ${user.isAdmin ? 'admin' : 'regular user'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, getAllUsers, deleteUser, toggleAdmin };