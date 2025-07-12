import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";

interface DialogProps {
  onCancel: () => void;
  onCommit?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  commitButtonLabel?: string;
  commitButtonVariant?: 'primary' | 'danger';
  showCancelButton?: boolean;
  cancelButtonLabel?: string;
}

const Dialog: React.FC<DialogProps> = ({
  onCancel,
  onCommit,
  title,
  children,
  maxWidth = "max-w-2xl",
  maxHeight = "max-h-[90vh]",
  showCancelButton = true,
  cancelButtonLabel = "Cancel",
  commitButtonLabel,
  commitButtonVariant = "primary",
}) => {
  // Handle escape key to close dialog
  useEffect(() => {    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const [isLoading, setIsLoading] = useState(false);

  const handleCommit = async () => {
    if (!onCommit) return;

    setIsLoading(true);
    await onCommit();
    setIsLoading(false);
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'danger') => {
    const baseClasses = "px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white`;
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white`;
      case 'secondary':
      default:
        return `${baseClasses} bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600 hover:border-zinc-500`;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`bg-zinc-900 border border-zinc-700 rounded-lg w-full ${maxWidth} ${maxHeight} flex flex-col shadow-2xl pointer-events-auto`}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {/* Footer with buttons - Fixed */}
        <div className="flex justify-end space-x-3 p-6 pt-4 flex-shrink-0">
          {/* Cancel button */}
          {showCancelButton && (
            <button
              onClick={onCancel}
              className={getButtonClasses("secondary")}
            >
              {cancelButtonLabel}
            </button>
          )}
          
          {/* Commit button */}
          {onCommit && commitButtonLabel && (
            <button
              onClick={handleCommit}
              disabled={isLoading}
              className={getButtonClasses(commitButtonVariant)}
            >
              {isLoading && <Spinner />}
              {commitButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog; 