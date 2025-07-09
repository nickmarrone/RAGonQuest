import { useSetAtom } from 'jotai';
import { toastAtom, type Toast } from '../atoms/toastAtom';

export const useToast = () => {
  const setToast = useSetAtom(toastAtom);

  const showToast = (message: string, type: Toast['type'] = 'success', duration?: number) => {
    setToast({ message, type, duration });
  };

  const showSuccess = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showToast(message, 'info', duration);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
  };
}; 