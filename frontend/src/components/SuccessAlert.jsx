import { CheckCircle } from 'lucide-react';

export default function SuccessAlert({ title = 'Success', message, onClose }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="font-semibold text-green-900">{title}</p>
        <p className="text-green-700 text-sm mt-1">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}
