import { useState, useEffect } from 'react';

interface UseCountdownProps {
    initialCount: number;
    onComplete: () => void;
    isActive: boolean;
}

export const useCountdown = ({ initialCount, onComplete, isActive }: UseCountdownProps) => {
    const [countdown, setCountdown] = useState(initialCount);

    useEffect(() => {
        let interval: number;

        if (isActive) {
            interval = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        onComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, onComplete]);

    const resetCountdown = () => {
        setCountdown(initialCount);
    };

    return { countdown, resetCountdown };
}; 