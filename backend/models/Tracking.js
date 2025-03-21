const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true
  },
  tracker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastNotified: {
    type: Date
  }
});

// Compound index to ensure a PM2 can only track a milestone once
TrackingSchema.index({ milestone: 1, tracker: 1 }, { unique: true });

const Tracking = mongoose.model('Tracking', TrackingSchema);

module.exports = Tracking;
