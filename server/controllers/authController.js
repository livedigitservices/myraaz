const jwt  = require('jsonwebtoken');
const User = require('../models/User.js');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Input validation helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (pw) => pw && pw.length >= 6;

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (!isValidPassword(password)) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (!password) return res.status(400).json({ message: 'Password is required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && await user.matchPassword(password)) {
      res.json({
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        isAdmin: user.isAdmin,
        token:   generateToken(user._id),
      });
    } else {
      // Don't reveal whether email exists
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

module.exports = { register, login };