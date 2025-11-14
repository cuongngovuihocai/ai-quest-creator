import React from 'react';

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 0 1-.75-.75V12.75h1.5v5.25a.75.75 0 0 1-.75.75Z" />
    </svg>
);

export default MicrophoneIcon;
