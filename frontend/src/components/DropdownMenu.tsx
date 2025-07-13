import React, { useEffect, useRef } from "react";
import Spinner from "./Spinner";

export interface DropdownItem {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  items: DropdownItem[];
  triggerContent?: React.ReactNode;
  className?: string;
  menuClassName?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onToggle,
  items,
  triggerContent = "▼",
  className = "",
  menuClassName = ""
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        // Only close if the click wasn't on the trigger button
        if (!triggerRef.current.contains(event.target as Node)) {
          onToggle(event as any);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  const getItemClassName = (item: DropdownItem) => {
    const baseClasses = "w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors flex items-center";
    
    if (item.variant === 'danger') {
      return `${baseClasses} text-red-400 hover:text-red-300`;
    }
    
    return baseClasses;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={onToggle}
        className="ml-2 p-0.5 text-xs text-zinc-400 hover:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={{ 
          lineHeight: 1, 
          height: '1.5em', 
          width: '1.5em', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <span style={{ 
          fontSize: '1em', 
          display: 'block', 
          lineHeight: 1 
        }}>
          {triggerContent}
        </span>
      </button>
      
      {isOpen && (
        <div className={`absolute right-2 top-8 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 min-w-[120px] ${menuClassName}`}>
          {items.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={getItemClassName(item)}
              disabled={item.disabled}
            >
              {item.loading && <Spinner />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu; 