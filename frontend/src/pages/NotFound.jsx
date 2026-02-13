import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto mb-6 text-orange-600" size={80} />
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</p>
        <p className="text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold"
        >
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
