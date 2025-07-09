import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { toastAtom } from '../atoms/toastAtom';

const Toast: React.FC = () => {
  const [toast, setToast] = useAtom(toastAtom);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const getToastStyles = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-600 border-red-700';
      case 'info':
        return 'bg-blue-600 border-blue-700';
      default:
        return 'bg-green-600 border-green-700';
    }
  };

  return (
    <div className={`fixed top-8 right-8 border text-white px-6 py-3 rounded shadow-lg z-50 flex items-center space-x-2 animate-fade-in ${getToastStyles()}`}>
      <span>{toast.message}</span>
      <span 
        onClick={() => setToast(null)}
        className="ml-2 text-white text-lg font-light hover:opacity-70 transition-opacity cursor-pointer select-none"
        aria-label="Close notification"
      >
        ×
      </span>
    </div>
  );
};

export default Toast; 