import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  }
};

export const milestoneService = {
  // For PM1
  getMyMilestones: async () => {
    const response = await apiClient.get('/milestones/my-milestones');
    return response.data;
  },
  
  createMilestone: async (milestoneData) => {
    const response = await apiClient.post('/milestones', milestoneData);
    return response.data;
  },
  
  updateProgress: async (milestoneId, progress) => {
    const response = await apiClient.patch(`/milestones/${milestoneId}/progress`, { progress });
    return response.data;
  },
  
  // For PM2
  getAvailableMilestones: async () => {
    const response = await apiClient.get('/milestones/available');
    return response.data;
  }
};

// Tracking services
export const trackingService = {
  // For PM2
  getTrackedMilestones: async () => {
    const response = await apiClient.get('/tracking/my-tracked');
    return response.data;
  },
  
  trackMilestone: async (milestoneId) => {
    const response = await apiClient.post(`/tracking/${milestoneId}`);
    return response.data;
  },
  
  // For PM1
  getMilestoneTrackers: async (milestoneId) => {
    const response = await apiClient.get(`/tracking/trackers/${milestoneId}`);
    return response.data;
  },
  
  getTotalTrackers: async () => {
    const response = await apiClient.get('/tracking/total-trackers');
    return response.data;
  }
};

// Notification services
export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  }
};

// User services
export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
  
  updateNotificationSettings: async (settings) => {
    const response = await apiClient.patch('/users/notification-settings', settings);
    return response.data;
  },
  
  updateInterestCategories: async (categories) => {
    const response = await apiClient.patch('/users/interest-categories', { categories });
    return response.data;
  },
  
  resetQueue: async () => {
    const response = await apiClient.post('/users/reset-queue');
    return response.data;
  }
};

export default {
  auth: authService,
  milestones: milestoneService,
  tracking: trackingService,
  notifications: notificationService,
  users: userService
};