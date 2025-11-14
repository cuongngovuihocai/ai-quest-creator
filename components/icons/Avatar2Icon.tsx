import React from 'react';

const Avatar2Icon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={className}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#73b06f"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(6 6) rotate(10 18 18) scale(1.2)" fill="#ffb238" rx="6"></rect>
            <g transform="translate(4 -4) rotate(0 18 18)">
                <path d="M15 20v-1a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1" fill="#000000" stroke="#000000" stroke-width="2"></path>
                <rect x="13" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
                <rect x="20" y="14" width="3.5" height="3.5" rx="1" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
);

export default Avatar2Icon;
