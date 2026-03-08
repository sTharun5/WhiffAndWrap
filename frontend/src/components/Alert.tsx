import React, { ReactNode } from 'react';
import './Alert.css';

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'tip';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    icon?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const defaults: Record<AlertVariant, { icon: string; label: string }> = {
    info: { icon: 'ℹ️', label: 'Info' },
    success: { icon: '✅', label: 'Success' },
    warning: { icon: '⚠️', label: 'Heads up' },
    error: { icon: '❌', label: 'Error' },
    tip: { icon: '💡', label: 'Tip' },
};

export default function Alert({ variant = 'info', title, children, icon, dismissible, onDismiss }: AlertProps) {
    const d = defaults[variant];
    return (
        <div className={`alert alert--${variant}`} role="alert">
            <span className="alert__icon">{icon || d.icon}</span>
            <div className="alert__body">
                {title && <p className="alert__title">{title || d.label}</p>}
                <div className="alert__content">{children}</div>
            </div>
            {dismissible && (
                <button className="alert__dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
            )}
        </div>
    );
}
