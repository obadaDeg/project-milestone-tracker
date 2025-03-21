const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const { router: authRoutes } = require('./routes/authRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const userRoutes = require('./routes/userRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config(
    
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

console.log(process.env.MONGODB_URI);


mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://obadadaghlasdev:8mswrdIi5BEs9JmQ@project-milestone-track.wbxzh.mongodb.net/?retryWrites=true&w=majority&appName=project-milestone-tracker")
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Milestone Tracker API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});