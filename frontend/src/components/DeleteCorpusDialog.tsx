import React from "react";
import type { Corpus } from "../types";
import Dialog from "./Dialog";

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
  if (!corpus) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onCancel={onClose}
      onCommit={onConfirm}
      title="Delete Corpus"
      maxWidth="max-w-md"
      commitButtonLabel={isLoading ? "Deleting..." : "Delete"}
      commitButtonVariant="danger"
      commitButtonDisabled={isLoading}
      commitButtonLoading={isLoading}
    >
      <p className="text-zinc-300">
        Are you sure you want to delete <span className="font-semibold text-white">"{corpus.name}"</span>? 
        This action cannot be undone and will remove all associated data.
      </p>
    </Dialog>
  );
};

export default DeleteCorpusDialog; 