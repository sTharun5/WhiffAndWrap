import { ReactNode } from 'react';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle, FiZap, FiX } from 'react-icons/fi';
import './Alert.css';

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'tip';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    icon?: ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const defaults: Record<AlertVariant, { icon: ReactNode; label: string }> = {
    info: { icon: <FiInfo />, label: 'Info' },
    success: { icon: <FiCheckCircle />, label: 'Success' },
    warning: { icon: <FiAlertTriangle />, label: 'Heads up' },
    error: { icon: <FiXCircle />, label: 'Error' },
    tip: { icon: <FiZap />, label: 'Tip' },
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
                <button
                    className="alert__dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <FiX />
                </button>
            )}
        </div>
    );
}
