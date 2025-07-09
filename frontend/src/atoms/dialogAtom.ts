import { atom } from 'jotai';
import type { Corpus } from '../types';
import type { CostEstimateData } from '../components/EstimateCostDialog';

export type DialogType = 'none' | 'create-corpus' | 'delete-corpus' | 'estimate-cost' | 'context-chunks';

export interface DialogState {
  type: DialogType;
  props?: any;
}

export interface CreateCorpusDialogProps {
  editingCorpus?: Corpus;
  onSuccess: (corpus: Corpus) => void;
}

export interface DeleteCorpusDialogProps {
  corpus: Corpus;
  onConfirm: () => void;
  isLoading: boolean;
}

export interface EstimateCostDialogProps {
  corpus: Corpus;
  costData?: CostEstimateData;
  loading: boolean;
  error?: string | null;
}

export interface ContextChunksDialogProps {
  chunks: string[];
}

export const dialogAtom = atom<DialogState>({ type: 'none' });

export const openDialogAtom = atom(
  null,
  (get, set, dialogState: DialogState) => {
    set(dialogAtom, dialogState);
  }
);

export const closeDialogAtom = atom(
  null,
  (get, set) => {
    set(dialogAtom, { type: 'none' });
  }
); 