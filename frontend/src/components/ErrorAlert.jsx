import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ title = 'Error', message, onClose }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="font-semibold text-red-900">{title}</p>
        <p className="text-red-700 text-sm mt-1">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}
