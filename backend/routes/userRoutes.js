
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const User = require('../models/AppUser.js');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.patch('/notification-settings', authMiddleware, async (req, res) => {
  try {
    const { email, dailySummary, push } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.notificationSettings = {
      email: email !== undefined ? email : user.notificationSettings.email,
      dailySummary: dailySummary !== undefined ? dailySummary : user.notificationSettings.dailySummary,
      push: push !== undefined ? push : user.notificationSettings.push
    };
    
    await user.save();
    
    res.json({
      message: 'Notification settings updated',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update interest categories (PM2 only)
router.patch('/interest-categories', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm2') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { categories } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.interestCategories = categories;
    await user.save();
    
    res.json({
      message: 'Interest categories updated',
      interestCategories: user.interestCategories
    });
  } catch (error) {
    console.error('Error updating interest categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset queue position (this would normally be done by a cron job)
router.post('/reset-queue', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm2') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.queuePosition = user.dailyTrackingLimit;
    await user.save();
    
    res.json({
      message: 'Queue position reset',
      queuePosition: user.queuePosition
    });
  } catch (error) {
    console.error('Error resetting queue position:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;