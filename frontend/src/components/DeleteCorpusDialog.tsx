import React from "react";
import type { Corpus } from "../types";
import Dialog from "./Dialog";

interface DeleteCorpusDialogProps {
  onClose: () => void;
  onCommit: () => Promise<void>;
  corpus: Corpus | null;
}

const DeleteCorpusDialog: React.FC<DeleteCorpusDialogProps> = ({
  onClose,
  onCommit,
  corpus,
}) => {
  if (!corpus) return null;

  const handleCommit = async () => {
    await onCommit();
  };

  return (
    <Dialog
      onCancel={onClose}
      onCommit={handleCommit}
      title="Delete Corpus"
      maxWidth="max-w-md"
      commitButtonLabel="Delete"
      commitButtonVariant="danger"
    >
      <p className="text-zinc-300">
        Are you sure you want to delete <span className="font-semibold text-white">"{corpus.name}"</span>? 
        This action cannot be undone and will remove all associated data.
      </p>
    </Dialog>
  );
};

export default DeleteCorpusDialog; 