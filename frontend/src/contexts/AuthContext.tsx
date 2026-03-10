import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { api } from '../lib/api';
import { useToast } from './ToastContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    image?: string | null;
    termsVersion?: string | null;
}

export const CURRENT_TERMS_VERSION = '1.0';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const handleSessionTerminated = () => {
            addToast('Your session was terminated because you logged in from another device.', 'error');
            logout();
        };
        window.addEventListener('session-terminated', handleSessionTerminated);
        return () => window.removeEventListener('session-terminated', handleSessionTerminated);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        try { await api.logout(); } catch (err) { console.error(err); }
        setToken(null);
        setUser(null);
    };

    const refresh = async () => {
        try {
            // Directly query /me. If the cookie is valid, this succeeds regardless of sessionStorage.
            const me = await api.me();
            setUser(me);
            // Optionally set token if needed in UI, though cookie does the heavy lifting
        } catch {
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};
