import React from 'react';

const Avatar4Icon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={className}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#2c7df7"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(6 6) rotate(10 18 18) scale(1.1)" fill="#f6d349" rx="6"></rect>
            <g transform="translate(4 -2) rotate(0 18 18)">
                <path d="M13,20 a1,1 0 0,0 10,0" fill="#000000"></path>
                <rect x="14" y="13" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
                <rect x="18" y="13" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
);

export default Avatar4Icon;
