import { useSetAtom } from 'jotai';
import { toastsAtom, type Toast } from '../atoms/toastAtom';

export const useToast = () => {
  const setToasts = useSetAtom(toastsAtom);

  const addToast = (message: string, type: Toast['type'] = 'success', duration?: number) => {
    const newToast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      duration,
      createdAt: Date.now(),
    };

    setToasts(prevToasts => {
      // Keep only the last 4 toasts (max 5 total with new one)
      const limitedToasts = prevToasts.slice(-4);
      return [...limitedToasts, newToast];
    });
  };

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const showToast = (message: string, type: Toast['type'] = 'success', duration?: number) => {
    addToast(message, type, duration);
  };

  const showSuccess = (message: string, duration?: number) => {
    addToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    addToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    addToast(message, 'info', duration);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast,
  };
}; 