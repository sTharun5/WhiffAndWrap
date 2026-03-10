import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean; // Changes confirm button to red
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
    return ctx;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolver(() => resolve);
        });
    };

    const handleConfirm = () => {
        if (resolver) resolver(true);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (resolver) resolver(false);
        setIsOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {isOpen && options && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '420px', animation: 'modalFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="modal__header">
                            <h3 style={{ margin: 0 }}>{options.title}</h3>
                        </div>
                        <div className="modal__body">
                            <p style={{ margin: 0, color: 'var(--color-text-light)' }}>{options.message}</p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn-outline" onClick={handleCancel}>
                                {options.cancelText || 'Cancel'}
                            </button>
                            <button
                                className={`btn ${options.danger ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleConfirm}
                            >
                                {options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
