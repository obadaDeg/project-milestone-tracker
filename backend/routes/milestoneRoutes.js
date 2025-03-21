
// routes/milestoneRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const Milestone = require('../models/Milestone');
const Tracking = require('../models/Tracking');
const Notification = require('../models/Notification');
const User = require('../models/AppUser');

// Get all milestones for PM1
router.get('/my-milestones', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm1') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const milestones = await Milestone.find({ owner: req.user.id });
    res.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new milestone (PM1 only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm1') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, description, endDate } = req.body;
    
    const newMilestone = new Milestone({
      name,
      description,
      owner: req.user.id,
      endDate: endDate || undefined
    });
    
    await newMilestone.save();
    res.status(201).json(newMilestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update milestone progress (PM1 only)
router.patch('/:id/progress', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm1') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { progress } = req.body;
    const milestoneId = req.params.id;
    
    // Find and update the milestone
    const milestone = await Milestone.findById(milestoneId);
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Check ownership
    if (milestone.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const oldProgress = milestone.progress;
    milestone.progress = progress;
    await milestone.save();
    
    // If milestone was completed (reached 100%), notify trackers
    if (progress === 100 && oldProgress !== 100) {
      // Find all PM2s tracking this milestone
      const trackingRecords = await Tracking.find({ milestone: milestoneId });
      
      // Send notifications to each PM2
      for (const record of trackingRecords) {
        const notification = new Notification({
          recipient: record.tracker,
          title: 'Milestone Completed',
          message: `${milestone.name} has been marked as complete.`,
          type: 'milestone_update',
          relatedMilestone: milestoneId
        });
        
        await notification.save();
        
        // Update the last notified timestamp
        record.lastNotified = Date.now();
        await record.save();
      }
    }
    
    res.json(milestone);
  } catch (error) {
    console.error('Error updating milestone progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available milestones for PM2 to track
router.get('/available', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'pm2') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get all milestones
    const milestones = await Milestone.find().populate('owner', 'username');
    
    // Find milestones this PM2 is already tracking
    const trackingRecords = await Tracking.find({ tracker: req.user.id });
    const trackedMilestoneIds = trackingRecords.map(record => record.milestone.toString());
    
    // Filter out already tracked milestones
    const availableMilestones = milestones
      .filter(milestone => !trackedMilestoneIds.includes(milestone._id.toString()))
      .map(milestone => ({
        id: milestone._id,
        name: milestone.name,
        description: milestone.description,
        pm: milestone.owner.username,
        progress: milestone.progress
      }));
    
    res.json(availableMilestones);
  } catch (error) {
    console.error('Error fetching available milestones:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
