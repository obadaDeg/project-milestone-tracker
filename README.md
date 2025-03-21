# Project Milestone Tracker

A full-stack application for tracking project milestones and dependencies between project managers.

## Overview

This application allows two types of users to collaborate:

1. **Project Managers (PM1)**: Create and update milestones for their projects
2. **Trackers (PM2)**: Monitor milestones from various PM1s to coordinate their own work

The system features:

- Progress tracking with 25%, 50%, 75%, and 100% completion states
- Automated notifications when milestones are completed
- Controlled flow of new PM2s tracking milestones
- Dashboard visualization for both user types

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository

```
git clone https://github.com/obadaDeg/milestone-tracker.git
cd milestone-tracker
```

2. Install dependencies

```
npm run install-all
```

3. Create environment variables

```
cp .env.example .env
```

Edit the `.env` file with your MongoDB connection string and JWT secret.

4. Seed the database with sample data

```
npm run seed
```

5. Start the development server

```
npm run dev
```

This will start both the backend server (port 5000) and the React development server (port 3000).

## Usage

### Demo Accounts

The seed script creates several demo accounts you can use:

| Type | Email             | Password    |
| ---- | ----------------- | ----------- |
| PM1  | pm1@example.com   | password123 |
| PM1  | pm1_2@example.com | password123 |
| PM2  | pm2@example.com   | password123 |
| PM2  | pm2_2@example.com | password123 |

### Key Features

#### For Project Managers (PM1)

- Create and manage milestones
- Update progress status (25%, 50%, 75%, 100%)
- See how many PM2s are tracking each milestone
- View a list of all PM2s tracking their milestones

#### For Trackers (PM2)

- Browse available milestones to track
- Select milestones relevant to their work
- Receive notifications when tracked milestones are updated
- Limited by a daily tracking quota (throttling system)

## API Documentation

The backend provides the following API endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Milestones

- `GET /api/milestones/my-milestones` - Get all milestones for PM1
- `POST /api/milestones` - Create a new milestone (PM1 only)
- `PATCH /api/milestones/:id/progress` - Update milestone progress (PM1 only)
- `GET /api/milestones/available` - Get available milestones for PM2 to track

### Tracking

- `GET /api/tracking/my-tracked` - Get milestones that PM2 is tracking
- `POST /api/tracking/:milestoneId` - Start tracking a milestone (PM2 only)
- `GET /api/tracking/trackers/:milestoneId` - Get trackers for a milestone (PM1 only)
- `GET /api/tracking/total-trackers` - Get total trackers for a PM1

### Notifications

- `GET /api/notifications` - Get all notifications for the logged in user
- `PATCH /api/notifications/:id/read` - Mark a notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read

### User

- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/notification-settings` - Update notification settings
- `PATCH /api/users/interest-categories` - Update interest categories (PM2 only)
- `POST /api/users/reset-queue` - Reset queue position (this would normally be done by a cron job)

## Future Enhancements

- Email notification implementation
- Real-time updates using WebSockets
- Mobile app version
- Advanced analytics dashboard
- Multi-level dependencies between milestones
- Team collaboration features

## License

MIT
