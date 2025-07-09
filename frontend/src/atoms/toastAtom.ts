import { atom } from 'jotai';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  createdAt: number;
}

export const toastsAtom = atom<Toast[]>([]); 