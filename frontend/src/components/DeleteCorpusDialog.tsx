import React from "react";
import type { Corpus } from "../types";

interface DeleteCorpusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  corpus: Corpus | null;
  isLoading: boolean;
}

const DeleteCorpusDialog: React.FC<DeleteCorpusDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  corpus,
  isLoading,
}) => {
  if (!isOpen || !corpus) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Delete Corpus
        </h3>
        
        <p className="text-zinc-300 mb-6">
          Are you sure you want to delete <span className="font-semibold text-white">"{corpus.name}"</span>? 
          This action cannot be undone and will remove all associated data.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-zinc-300 hover:text-white border border-zinc-600 hover:border-zinc-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCorpusDialog; 