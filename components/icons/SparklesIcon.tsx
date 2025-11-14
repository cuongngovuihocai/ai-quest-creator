import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M9.315 7.585C8.645 8.255 8 9.295 8 10.5c0 1.205.645 2.245 1.315 2.915C10.055 14.155 11 14.5 12 14.5c1 0 1.945-.345 2.685-1.085C15.355 12.745 16 11.705 16 10.5c0-1.205-.645-2.245-1.315-2.915C13.945 6.845 13 6.5 12 6.5c-1 0-1.945.345-2.685 1.085zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      clipRule="evenodd"
    />
  </svg>
);

export default SparklesIcon;
