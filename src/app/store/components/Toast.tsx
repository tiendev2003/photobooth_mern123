"use client";

interface ToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ show, message, type, onClose }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`max-w-sm w-full rounded-lg shadow-lg border-l-4 p-4 ${
        type === 'success'
          ? 'bg-green-50 border-green-400 text-green-800'
          : 'bg-red-50 border-red-400 text-red-800'
      }`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
