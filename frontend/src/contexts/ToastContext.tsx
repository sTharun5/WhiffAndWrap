import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
    addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);

    const icons: Record<Toast['type'], ReactNode> = {
        success: <FiCheckCircle />,
        error: <FiXCircle />,
        info: <FiInfo />,
        warning: <FiAlertTriangle />,
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <span className="toast-icon">{icons[t.type]}</span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
