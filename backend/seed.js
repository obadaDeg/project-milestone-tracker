/**
 * Seed script to populate the database with sample data for testing purposes.
 *
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load models
const User = require("./models/User");
const Milestone = require("./models/Milestone");
const Tracking = require("./models/Tracking");
const Notification = require("./models/Notification");

dotenv.config();

mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/milestone-tracker"
  )
  .then(() => console.log("MongoDB connected successfully for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const sampleUsers = [
  {
    username: "pm1user",
    email: "pm1@example.com",
    password: "password123",
    userType: "pm1",
  },
  {
    username: "pm1user2",
    email: "pm1_2@example.com",
    password: "password123",
    userType: "pm1",
  },
  {
    username: "pm2user",
    email: "pm2@example.com",
    password: "password123",
    userType: "pm2",
    interestCategories: ["Requirements Analysis", "Testing", "Deployment"],
  },
  {
    username: "pm2user2",
    email: "pm2_2@example.com",
    password: "password123",
    userType: "pm2",
    interestCategories: ["System Design", "Development"],
  },
];

const sampleMilestones = [
  {
    name: "Requirements Analysis",
    description:
      "Gather and document all system requirements from stakeholders",
    progress: 75,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    name: "System Design",
    description: "Create system architecture and component designs",
    progress: 50,
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Development Phase 1",
    description: "Implement core system functionalities",
    progress: 25,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Testing",
    description: "Perform system and integration testing",
    progress: 0,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Deployment",
    description: "Deploy system to production environment",
    progress: 0,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
];

const sampleNotifications = [
  {
    title: "Milestone Completed",
    message: "Requirements gathering has been marked as 100% complete.",
    type: "milestone_update",
  },
  {
    title: "New Tracker",
    message: "PM2 user is now tracking your System Design milestone.",
    type: "new_tracker",
  },
  {
    title: "Queue Position Update",
    message: "You can track 3 more milestones today.",
    type: "queue_update",
  },
];

const seedDatabase = async () => {
  try {
    await User.deleteMany({});
    await Milestone.deleteMany({});
    await Tracking.deleteMany({});
    await Notification.deleteMany({});

    console.log("Cleared existing data");

    const createdUsers = {};

    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      createdUsers[userData.username] = savedUser;

      console.log(`Created user: ${userData.username}`);
    }

    const createdMilestones = [];

    for (const milestoneData of sampleMilestones) {
      const pm1Users = Object.values(createdUsers).filter(
        (user) => user.userType === "pm1"
      );
      const randomPM1 = pm1Users[Math.floor(Math.random() * pm1Users.length)];

      const milestone = new Milestone({
        ...milestoneData,
        owner: randomPM1._id,
      });

      const savedMilestone = await milestone.save();
      createdMilestones.push(savedMilestone);

      console.log(`Created milestone: ${milestoneData.name}`);
    }

    const pm2Users = Object.values(createdUsers).filter(
      (user) => user.userType === "pm2"
    );

    for (const pm2User of pm2Users) {
      const numToTrack = Math.floor(Math.random() * 3) + 1;
      const shuffledMilestones = [...createdMilestones].sort(
        () => 0.5 - Math.random()
      );
      const milestonesToTrack = shuffledMilestones.slice(0, numToTrack);

      for (const milestone of milestonesToTrack) {
        const tracking = new Tracking({
          milestone: milestone._id,
          tracker: pm2User._id,
        });

        await tracking.save();

        milestone.trackingPMs += 1;
        await milestone.save();

        console.log(
          `Created tracking: ${pm2User.username} -> ${milestone.name}`
        );
      }
    }

    // Create notifications
    for (const notifData of sampleNotifications) {
      // Random milestone for milestone updates
      const randomMilestone =
        createdMilestones[Math.floor(Math.random() * createdMilestones.length)];

      // Determine recipient based on notification type
      let recipient;
      if (notifData.type === "milestone_update") {
        // For milestone updates, recipient is a PM2
        recipient = pm2Users[Math.floor(Math.random() * pm2Users.length)]._id;
      } else if (notifData.type === "new_tracker") {
        // For new tracker notifications, recipient is a PM1
        recipient = randomMilestone.owner;
      } else {
        // For queue updates, recipient is a PM2
        recipient = pm2Users[Math.floor(Math.random() * pm2Users.length)]._id;
      }

      const notification = new Notification({
        ...notifData,
        recipient,
        relatedMilestone:
          notifData.type === "milestone_update"
            ? randomMilestone._id
            : undefined,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000
        ), // Random time within last 10 days
      });

      await notification.save();
      console.log(`Created notification: ${notifData.title}`);
    }

    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
