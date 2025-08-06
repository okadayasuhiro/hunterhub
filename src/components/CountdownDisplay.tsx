import React from 'react';

interface CountdownDisplayProps {
    countdown: number;
    backgroundColor?: string;
    textColor?: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
    countdown,
    backgroundColor = 'bg-blue-600',
    textColor = 'text-white'
}) => {
    return (
        <div className={`${backgroundColor} ${textColor} p-8 rounded-lg text-center`}>
            <div className="text-6xl font-bold animate-pulse">
                {countdown > 0 ? countdown : 'START!'}
            </div>
        </div>
    );
};

export default CountdownDisplay; 