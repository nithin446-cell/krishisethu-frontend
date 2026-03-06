import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 32, message = 'Loading...', className = '' }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-10 text-gray-500 ${className}`}>
            <Loader2 className="animate-spin mb-3 text-green-600" size={size} />
            {message && <p className="text-sm font-medium">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
