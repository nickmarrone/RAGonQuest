import React, { useEffect } from "react";

export interface DialogButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

interface DialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onCommit?: () => void;
  title?: string;
  children: React.ReactNode;
  buttons?: DialogButton[];
  maxWidth?: string;
  maxHeight?: string;
  showCancelButton?: boolean;
  cancelButtonLabel?: string;
  commitButtonLabel?: string;
  commitButtonVariant?: 'primary' | 'danger';
  commitButtonDisabled?: boolean;
  commitButtonLoading?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onCancel,
  onCommit,
  title,
  children,
  buttons,
  maxWidth = "max-w-2xl",
  maxHeight = "max-h-[90vh]",
  showCancelButton = true,
  cancelButtonLabel = "Cancel",
  commitButtonLabel,
  commitButtonVariant = "primary",
  commitButtonDisabled = false,
  commitButtonLoading = false,
}) => {
  // Handle escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getButtonClasses = (variant: DialogButton['variant'] = 'secondary') => {
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
      <div className={`bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full ${maxWidth} ${maxHeight} overflow-y-auto shadow-2xl pointer-events-auto`}>
        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Footer with buttons */}
        {(buttons && buttons.length > 0) || onCommit || showCancelButton ? (
          <div className="flex justify-end space-x-3 pt-4">
            {/* Custom buttons */}
            {buttons && buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                disabled={button.disabled}
                className={getButtonClasses(button.variant)}
              >
                {button.loading ? "Loading..." : button.label}
              </button>
            ))}
            
            {/* Cancel button */}
            {showCancelButton && !buttons?.some(b => b.label === cancelButtonLabel) && (
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
                onClick={onCommit}
                disabled={commitButtonDisabled}
                className={getButtonClasses(commitButtonVariant)}
              >
                {commitButtonLoading ? "Loading..." : commitButtonLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dialog; 