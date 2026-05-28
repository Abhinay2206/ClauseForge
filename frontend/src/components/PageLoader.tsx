import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageLoader() {
    const location = useLocation();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        setProgress(30);

        const timer1 = setTimeout(() => setProgress(70), 150);
        const timer2 = setTimeout(() => setProgress(100), 300);

        const timer3 = setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 550);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [location.pathname]);

    return (
        <div 
            className="fixed top-0 left-0 w-full h-[3px] z-[9999] pointer-events-none transition-opacity duration-300"
            style={{ 
                opacity: visible ? 1 : 0, 
                display: progress === 0 && !visible ? 'none' : 'block' 
            }}
        >
            <div 
                className="h-full bg-blue-600 transition-all ease-out"
                style={{ 
                    width: `${progress}%`,
                    transitionDuration: progress === 100 ? '250ms' : '400ms',
                    boxShadow: '0 0 10px rgba(37,99,235,0.5)' 
                }}
            />
        </div>
    );
}
