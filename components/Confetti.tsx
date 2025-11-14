import React from 'react';

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-2 h-4" style={style}></div>
);

const Confetti: React.FC = () => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    const pieces = Array.from({ length: 150 }).map((_, index) => {
        const left = `${Math.random() * 100}%`;
        const animDuration = `${Math.random() * 3 + 2}s`;
        const animDelay = `${Math.random() * 5}s`;
        const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const transform = `rotate(${Math.random() * 360}deg)`;

        const style: React.CSSProperties = {
            left,
            backgroundColor,
            transform,
            animation: `fall ${animDuration} ${animDelay} linear infinite`,
        };

        return <ConfettiPiece key={index} style={style} />;
    });

    return (
        <>
            <style>
                {`
                @keyframes fall {
                    0% { top: -10%; opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                `}
            </style>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
                {pieces}
            </div>
        </>
    );
};

export default Confetti;
