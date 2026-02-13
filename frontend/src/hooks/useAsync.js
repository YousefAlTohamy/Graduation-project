import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API calls with loading and error states
 * @param {Function} asyncFunction - The async function to execute
 * @returns {Object} - { execute, loading, error, data, clearError }
 */
export const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await asyncFunction(...args);
        setData(response);
        return response;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.data?.message ||
          err.message ||
          'An unexpected error occurred';
        setError(errorMessage);
        console.error('Async operation failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, data, clearError };
};

export default useAsync;
