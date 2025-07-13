import React from 'react';

const Spinner: React.FC = () => {
  return (
    <span className="mr-2 inline-block animate-spin text-white" style={{ width: '1em', height: '1em' }}>
        <svg
            className="w-4 h-4"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
        <circle
            className="opacity-25"
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M15 8a7 7 0 01-7 7V13a5 5 0 005-5h2z"
        />
        </svg>
    </span>
  );
};

export default Spinner;