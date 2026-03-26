const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const GOOGLE_COLORS = [
  '#4285F4', // Blue
  '#DB4437', // Red
  '#F4B400', // Yellow
  '#0F9D58', // Green
  '#7C3AED', // Purple
  '#E91E63', // Pink
  '#00BFA5', // Teal
  '#FF7043'  // Orange
];

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const randomColor = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
    const newUser = new User({ username, email, password, color: randomColor });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    res.json({ token, user: { id: newUser._id, username, email, color: newUser.color } });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, color: user.color } });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

module.exports = router;
