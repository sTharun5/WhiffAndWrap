import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { api } from '../lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    image?: string | null;
}

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

    const login = (newToken: string, newUser: User) => {
        sessionStorage.setItem('ww_token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        sessionStorage.removeItem('ww_token');
        setToken(null);
        setUser(null);
    };

    const refresh = async () => {
        const stored = sessionStorage.getItem('ww_token');
        if (!stored) { setLoading(false); return; }
        try {
            setToken(stored);
            const me = await api.me();
            setUser(me);
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
