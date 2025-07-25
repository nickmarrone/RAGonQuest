import React from "react";
import Dialog from "./Dialog";

interface ContextChunksDialogProps {
  onClose: () => void;
  chunks: string[];
}

const ContextChunksDialog: React.FC<ContextChunksDialogProps> = ({
  onClose,
  chunks,
}) => {
  return (
    <Dialog
      onCancel={onClose}
      title="Context"
      maxWidth="max-w-4xl"
      showCancelButton={true}
      cancelButtonLabel="Close"
    >
      <div className="space-y-4">
        {chunks.map((chunk, idx) => (
          <div key={idx} className="bg-zinc-800 rounded p-3 text-zinc-200 text-sm whitespace-pre-wrap">
            {chunk}
          </div>
        ))}
      </div>
    </Dialog>
  );
};

export default ContextChunksDialog; 