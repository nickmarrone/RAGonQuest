import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { toastsAtom } from '../atoms/toastAtom';
import { useToast } from '../hooks/useToast';

interface ToastItemProps {
  toast: {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    createdAt: number;
  };
  onRemove: (id: string) => void;
  index: number;
  totalToasts: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, index, totalToasts }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in animation
    const fadeInTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Calculate remaining time based on when toast was created
    // This ensures each toast maintains its original timeout regardless of re-renders
    const elapsed = Date.now() - toast.createdAt;
    const remaining = Math.max(0, (toast.duration || 3000) - elapsed);
    
    // Auto-remove timer
    const removeTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300); // Wait for fade out animation
    }, remaining);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, toast.createdAt, onRemove]);

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

  const topPosition = 8 + ((totalToasts - 1 - index) * 80); // Newest toast at top, older ones pushed down

  return (
    <div
      className={`fixed right-8 border text-white px-6 py-3 rounded shadow-lg z-50 flex items-center space-x-2 transition-all duration-300 ease-in-out ${
        getToastStyles()
      } ${
        isVisible && !isExiting 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full'
      }`}
      style={{ top: `${topPosition}px` }}
    >
      <span>{toast.message}</span>
      <span 
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="ml-2 text-white text-lg font-light hover:opacity-70 transition-opacity cursor-pointer select-none"
        aria-label="Close notification"
      >
        ×
      </span>
    </div>
  );
};

const Toast: React.FC = () => {
  const [toasts] = useAtom(toastsAtom);
  const { removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
          index={index}
          totalToasts={toasts.length}
        />
      ))}
    </>
  );
};

export default Toast; 