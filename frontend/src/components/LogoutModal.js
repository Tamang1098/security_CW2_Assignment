import React, { useEffect, useState } from 'react';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Progress bar animation
            const duration = 1500; // 1.5 seconds
            const interval = 20; // Update every 20ms
            const increment = (100 / (duration / interval));

            const progressTimer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressTimer);
                        return 100;
                    }
                    return prev + increment;
                });
            }, interval);

            // Complete logout after animation
            const completeTimer = setTimeout(() => {
                onComplete();
            }, duration);

            return () => {
                clearInterval(progressTimer);
                clearTimeout(completeTimer);
                setProgress(0);
            };
        }
    }, [isOpen, onComplete]);

    if (!isOpen) return null;

    return (
        <div className="logout-modal-overlay">
            <div className="logout-modal-content">
                <div className="logout-icon">👋</div>
                <h2>Logging Out</h2>
                <div className="logout-progress-bar">
                    <div className="logout-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="logout-text">See you again soon!</p>
            </div>
        </div>
    );
};

export default LogoutModal;
