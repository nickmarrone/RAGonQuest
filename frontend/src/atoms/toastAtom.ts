import { atom } from 'jotai';

export interface Toast {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const toastAtom = atom<Toast | null>(null); 