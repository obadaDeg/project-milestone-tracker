
// routes/trackingRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const Tracking = require('../models/Tracking');
const Milestone = require('../models/Milestone');
const User = require('../models/AppUser');
const Notification = require('../models/Notification');

// Get milestones that PM2 is tracking
router.get('/my-tracked', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm2') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const trackingRecords = await Tracking.find({ tracker: req.user.id })
      .populate({
        path: 'milestone',
        populate: { path: 'owner', select: 'username' }
      });
    
    const trackedMilestones = trackingRecords.map(record => ({
      id: record.milestone._id,
      name: record.milestone.name,
      description: record.milestone.description,
      pm: record.milestone.owner.username,
      progress: record.milestone.progress,
      trackingSince: record.createdAt
    }));
    
    res.json(trackedMilestones);
  } catch (error) {
    console.error('Error fetching tracked milestones:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start tracking a milestone (PM2 only)
router.post('/:milestoneId', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm2') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const milestoneId = req.params.milestoneId;
    const user = await User.findById(req.user.id);
    
    // Check if user has available queue positions
    if (user.queuePosition <= 0) {
      return res.status(400).json({ message: 'Daily tracking limit reached' });
    }
    
    // Check if milestone exists
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Check if already tracking
    const existingTracking = await Tracking.findOne({
      milestone: milestoneId,
      tracker: req.user.id
    });
    
    if (existingTracking) {
      return res.status(400).json({ message: 'Already tracking this milestone' });
    }
    
    // Create tracking record
    const newTracking = new Tracking({
      milestone: milestoneId,
      tracker: req.user.id
    });
    
    await newTracking.save();
    
    // Update milestone tracking count
    milestone.trackingPMs += 1;
    await milestone.save();
    
    // Decrease user's queue position
    user.queuePosition -= 1;
    await user.save();
    
    // Notify PM1 about new tracker
    const notification = new Notification({
      recipient: milestone.owner,
      title: 'New Tracker',
      message: `${user.username} is now tracking your "${milestone.name}" milestone.`,
      type: 'new_tracker',
      relatedMilestone: milestoneId
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Now tracking milestone',
      queuePosition: user.queuePosition
    });
  } catch (error) {
    console.error('Error tracking milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trackers for a milestone (PM1 only)
router.get('/trackers/:milestoneId', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm1') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const milestoneId = req.params.milestoneId;
    
    // Check milestone ownership
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone || milestone.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get tracking records
    const trackingRecords = await Tracking.find({ milestone: milestoneId })
      .populate('tracker', 'username email');
    
    const trackers = trackingRecords.map(record => ({
      id: record.tracker._id,
      username: record.tracker.username,
      trackingSince: record.createdAt
    }));
    
    res.json(trackers);
  } catch (error) {
    console.error('Error fetching trackers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get total trackers for a PM1
router.get('/total-trackers', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm1') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get all milestones owned by this PM1
    const milestones = await Milestone.find({ owner: req.user.id });
    const milestoneIds = milestones.map(m => m._id);
    
    // Count unique trackers
    const trackingRecords = await Tracking.find({
      milestone: { $in: milestoneIds }
    }).populate('tracker', 'username');
    
    // Get unique trackers
    const uniqueTrackers = [...new Set(trackingRecords.map(record => 
      record.tracker._id.toString()
    ))];
    
    const trackerDetails = uniqueTrackers.map(trackerId => {
      const record = trackingRecords.find(r => 
        r.tracker._id.toString() === trackerId
      );
      return {
        id: trackerId,
        username: record.tracker.username
      };
    });
    
    res.json({
      count: uniqueTrackers.length,
      trackers: trackerDetails
    });
  } catch (error) {
    console.error('Error fetching total trackers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
