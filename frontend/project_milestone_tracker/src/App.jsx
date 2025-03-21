import React, { useState, useEffect } from "react";
import {
  authService,
  milestoneService,
  trackingService,
  notificationService,
  userService,
} from "./services/api";

// Main App Component
const App = () => {
  const [view, setView] = useState("login");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView("dashboard");
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);
      setUser(data.user);
      setView("dashboard");
      setError(null);
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      const data = await authService.register(userData);
      setUser(data.user);
      setView("dashboard");
      setError(null);
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView("login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header user={user} setView={setView} onLogout={handleLogout} />

      <main className="flex-grow p-4">
        {view === "login" && (
          <LoginRegisterScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            error={error}
          />
        )}

        {view === "dashboard" && user?.userType === "pm1" && (
          <PM1Dashboard user={user} />
        )}

        {view === "dashboard" && user?.userType === "pm2" && (
          <PM2Dashboard user={user} />
        )}

        {view === "settings" && <Settings user={user} />}

        {view === "notifications" && <Notifications user={user} />}
      </main>

      <Footer />
    </div>
  );
};

// Settings Component
const Settings = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    dailySummary: true,
    push: false,
  });
  const [interestCategories, setInterestCategories] = useState([]);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userService.getProfile();
      setProfile(profileData);
      setNotificationSettings(profileData.notificationSettings);

      if (user.userType === "pm2") {
        setInterestCategories(profileData.interestCategories || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const handleCategoryToggle = (category) => {
    if (interestCategories.includes(category)) {
      setInterestCategories(
        interestCategories.filter((cat) => cat !== category)
      );
    } else {
      setInterestCategories([...interestCategories, category]);
    }
  };

  const saveSettings = async () => {
    try {
      // Update notification settings
      await userService.updateNotificationSettings(notificationSettings);

      // Update interest categories for PM2
      if (user.userType === "pm2") {
        await userService.updateInterestCategories(interestCategories);
      }

      // Show success message
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        {updateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Settings updated successfully!
          </div>
        )}

        {user.userType === "pm1" && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold">Milestone Management</h3>
            <p>Configure your milestones and notification preferences here.</p>
          </div>
        )}

        {user.userType === "pm2" && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold">Tracking Preferences</h3>
            <p>
              Configure which types of milestones you're interested in tracking.
            </p>
            <div className="border p-4 rounded">
              <h4 className="font-bold mb-2">Interest Categories</h4>
              <div className="space-y-2">
                {[
                  "Requirements Analysis",
                  "System Design",
                  "Development",
                  "Testing",
                  "Deployment",
                ].map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={interestCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-bold mb-3">Notification Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={notificationSettings.email}
                onChange={() => handleNotificationSettingsChange("email")}
              />
              Email notifications for milestone updates
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={notificationSettings.dailySummary}
                onChange={() =>
                  handleNotificationSettingsChange("dailySummary")
                }
              />
              Daily summary reports
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={notificationSettings.push}
                onChange={() => handleNotificationSettingsChange("push")}
              />
              Push notifications
            </label>
          </div>

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={saveSettings}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsData = await notificationService.getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No notifications at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`border-l-4 p-4 ${
                  notification.read
                    ? "border-gray-300 bg-gray-50"
                    : "border-blue-500 bg-blue-50"
                } cursor-pointer`}
                onClick={() =>
                  !notification.read && markAsRead(notification._id)
                }
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold">{notification.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{notification.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Header Component
const Header = ({ user, setView, onLogout }) => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Milestone Tracker</h1>
        {user && (
          <div className="flex items-center">
            <span className="mr-4">
              Welcome, {user.username} (
              {user.userType === "pm1" ? "Project Manager" : "Tracker"})
            </span>
            <nav className="flex space-x-4">
              <button
                className="px-3 py-1 rounded hover:bg-blue-700"
                onClick={() => setView("dashboard")}
              >
                Dashboard
              </button>
              <button
                className="px-3 py-1 rounded hover:bg-blue-700"
                onClick={() => setView("settings")}
              >
                Settings
              </button>
              <button
                className="px-3 py-1 rounded hover:bg-blue-700"
                onClick={() => setView("notifications")}
              >
                Notifications
              </button>
              <button
                className="px-3 py-1 rounded hover:bg-blue-700 bg-red-600"
                onClick={onLogout}
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center">
      <p>&copy; 2025 Milestone Tracker. All rights reserved.</p>
    </footer>
  );
};

// Login/Register Screen Component
const LoginRegisterScreen = ({ onLogin, onRegister, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("pm1");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister({ username, email, password, userType });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-16">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? "Login to Milestone Tracker" : "Create an Account"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-gray-700 mb-1">Account Type</label>
            <select
              className="w-full p-2 border rounded"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="pm1">Project Manager (PM1)</option>
              <option value="pm2">Tracker (PM2)</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
        >
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <div className="text-center mt-4">
        <button
          className="text-blue-500 hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>

      {isLogin && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              className="bg-gray-100 p-2 rounded hover:bg-gray-200"
              onClick={() => {
                setEmail("pm1@example.com");
                setPassword("password123");
              }}
            >
              PM1: pm1@example.com
            </button>
            <button
              className="bg-gray-100 p-2 rounded hover:bg-gray-200"
              onClick={() => {
                setEmail("pm2@example.com");
                setPassword("password123");
              }}
            >
              PM2: pm2@example.com
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// PM1 Dashboard Component
const PM1Dashboard = ({ user }) => {
  const [milestones, setMilestones] = useState([]);
  const [totalTrackers, setTotalTrackers] = useState(0);
  const [trackerList, setTrackerList] = useState([]);
  const [showTrackers, setShowTrackers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    description: "",
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch milestones
      const milestonesData = await milestoneService.getMyMilestones();
      setMilestones(milestonesData);

      // Fetch total trackers
      const trackersData = await trackingService.getTotalTrackers();
      setTotalTrackers(trackersData.count);
      setTrackerList(trackersData.trackers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (id, newProgress) => {
    try {
      await milestoneService.updateProgress(id, newProgress);

      // Update local state
      setMilestones(
        milestones.map((milestone) =>
          milestone._id === id
            ? { ...milestone, progress: newProgress }
            : milestone
        )
      );
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleCreateMilestone = async () => {
    try {
      await milestoneService.createMilestone(newMilestone);

      // Reset form and refresh milestones
      setNewMilestone({
        name: "",
        description: "",
        endDate: "",
      });
      setCreating(false);
      fetchData();
    } catch (error) {
      console.error("Error creating milestone:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your dashboard...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">My Milestones</h2>
          <div className="flex items-center">
            <div
              className="bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-full cursor-pointer mr-4"
              onClick={() => setShowTrackers(!showTrackers)}
            >
              {totalTrackers} PMs Tracking You
            </div>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => setCreating(!creating)}
            >
              {creating ? "Cancel" : "New Milestone"}
            </button>
          </div>
        </div>

        {showTrackers && (
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Project Managers Tracking You:</h3>
            {trackerList.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2">
                {trackerList.map((tracker) => (
                  <li key={tracker.id} className="bg-white p-2 rounded shadow">
                    {tracker.username}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No project managers are tracking you yet.</p>
            )}
          </div>
        )}

        {creating && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h3 className="text-lg font-bold mb-3">Create New Milestone</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newMilestone.name}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      description: e.target.value,
                    })
                  }
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={newMilestone.endDate}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>

              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleCreateMilestone}
              >
                Create Milestone
              </button>
            </div>
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>You haven't created any milestones yet.</p>
            <button
              className="text-blue-500 hover:underline mt-2"
              onClick={() => setCreating(true)}
            >
              Create your first milestone
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((milestone) => (
              <div key={milestone._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">{milestone.name}</h3>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                    {milestone.trackingPMs} PMs tracking
                  </span>
                </div>

                {milestone.description && (
                  <p className="text-gray-600 mb-3">{milestone.description}</p>
                )}

                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${milestone.progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between mt-2">
                  <span>{milestone.progress}% Complete</span>
                  <div className="space-x-2">
                    {[25, 50, 75, 100].map((progress) => (
                      <button
                        key={progress}
                        className={`px-2 py-1 rounded ${
                          milestone.progress === progress
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                        onClick={() => updateProgress(milestone._id, progress)}
                      >
                        {progress}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// PM2 Dashboard Component
const PM2Dashboard = ({ user }) => {
  const [availableMilestones, setAvailableMilestones] = useState([]);
  const [trackedMilestones, setTrackedMilestones] = useState([]);
  const [queuePosition, setQueuePosition] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tracked milestones
      const trackedData = await trackingService.getTrackedMilestones();
      setTrackedMilestones(trackedData);

      // Fetch available milestones
      const availableData = await milestoneService.getAvailableMilestones();
      setAvailableMilestones(availableData);

      // Fetch user profile to get queue position
      const profileData = await userService.getProfile();
      setQueuePosition(profileData.queuePosition);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackMilestone = async (milestoneId) => {
    try {
      if (queuePosition <= 0) return;

      const response = await trackingService.trackMilestone(milestoneId);

      // Update queue position
      setQueuePosition(response.queuePosition);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error tracking milestone:", error);
    }
  };

  const handleResetQueue = async () => {
    try {
      const response = await userService.resetQueue();
      setQueuePosition(response.queuePosition);
    } catch (error) {
      console.error("Error resetting queue:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your dashboard...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Milestone Tracking Dashboard
        </h2>

        <div className="bg-yellow-100 p-4 rounded-lg mb-6 flex justify-between items-center">
          <p className="font-bold">
            {queuePosition > 0
              ? `You can track ${queuePosition} more milestones today`
              : "You have reached your daily tracking limit"}
          </p>
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            onClick={handleResetQueue}
          >
            Reset Tracking Limit
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3">
            Milestones I'm Tracking ({trackedMilestones.length})
          </h3>
          {trackedMilestones.length === 0 ? (
            <p className="text-gray-500">
              You're not tracking any milestones yet.
            </p>
          ) : (
            <div className="space-y-4">
              {trackedMilestones.map((milestone) => (
                <div key={milestone.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{milestone.name}</h4>
                    <span>{milestone.pm}</span>
                  </div>
                  {milestone.description && (
                    <p className="text-gray-600 mb-3">
                      {milestone.description}
                    </p>
                  )}
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span>{milestone.progress}% Complete</span>
                    <span className="text-xs text-gray-500">
                      Tracking since:{" "}
                      {new Date(milestone.trackingSince).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">
            Available Milestones to Track
          </h3>
          {availableMilestones.length === 0 ? (
            <p className="text-gray-500">
              No new milestones available to track at this time.
            </p>
          ) : (
            <div className="space-y-4">
              {availableMilestones.map((milestone) => (
                <div key={milestone.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{milestone.name}</h4>
                    <span>Owner: {milestone.pm}</span>
                  </div>
                  {milestone.description && (
                    <p className="text-gray-600 mb-3">
                      {milestone.description}
                    </p>
                  )}
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>{milestone.progress}% Complete</span>
                    <button
                      className={`px-3 py-1 rounded ${
                        queuePosition > 0
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() => trackMilestone(milestone.id)}
                      disabled={queuePosition <= 0}
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;