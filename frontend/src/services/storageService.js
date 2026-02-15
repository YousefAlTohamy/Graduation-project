/**
 * Local Storage Service for managing app data
 */
export const storageService = {
  // Auth data
  setAuthToken: (token) => localStorage.setItem('auth_token', token),
  getAuthToken: () => localStorage.getItem('auth_token'),
  removeAuthToken: () => localStorage.removeItem('auth_token'),

  // User data
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  },
  removeUser: () => localStorage.removeItem('user'),

  // Cache management
  setCache: (key, value, ttl = 3600000) => {
    const data = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
  },

  getCache: (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(`cache_${key}`));
      if (!data) return null;

      // Check if cache has expired
      if (Date.now() - data.timestamp > data.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  removeCache: (key) => localStorage.removeItem(`cache_${key}`),
  clearAllCache: () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Clear all data
  clear: () => localStorage.clear(),
};

export default storageService;
