import { Loader } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader className="animate-spin text-primary" size={40} />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return <div className="flex justify-center py-12">{spinnerContent}</div>;
}
