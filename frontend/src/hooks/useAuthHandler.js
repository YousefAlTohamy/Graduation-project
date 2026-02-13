import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for authentication-related operations
 */
export const useAuthHandler = () => {
  const { user, login, register, logout } = useAuth();

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      logout();
      return 'Your session has expired. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    return error.response?.data?.message || error.message || 'An error occurred';
  };

  return { user, login, register, logout, handleApiError };
};

export default useAuthHandler;
