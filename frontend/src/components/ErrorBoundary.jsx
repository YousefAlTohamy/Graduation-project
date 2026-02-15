import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const errorHandler = (event) => {
      console.error('Error caught by boundary:', event.error);
      setHasError(true);
      setError(event.error?.message || 'An unexpected error occurred');
    };

    const unhandledRejectionHandler = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(event.reason?.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="text-red-600" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Something went wrong
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {error || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return children;
}
