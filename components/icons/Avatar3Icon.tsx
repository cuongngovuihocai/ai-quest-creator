import React from 'react';

const Avatar3Icon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={className}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#624e3c"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(-4 4) rotate(220 18 18) scale(1.2)" fill="#ffad08" rx="36"></rect>
            <g transform="translate(-2 0) rotate(0 18 18)">
                <path d="M13,19 a1,1 0 0,0 10,0" fill="#FFFFFF"></path>
                <rect x="14" y="14" width="1.5" height="1.5" rx="1" fill="#000000"></rect>
                <rect x="20" y="14" width="1.5" height="1.5" rx="1" fill="#000000"></rect>
            </g>
        </g>
    </svg>
);

export default Avatar3Icon;
