import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: any[];
    unreadCount: number;
    loading: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: (type?: 'USER' | 'ADMIN') => Promise<void>;
    clearAll: (type?: 'USER' | 'ADMIN') => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshNotifications = async () => {
        if (!user) {
            setNotifications([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshNotifications();
        // Set up a simple polling mechanism for notifications every 30 seconds
        const interval = setInterval(() => {
            if (user) refreshNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const markRead = async (id: string) => {
        try {
            await api.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Mark read failed:', err);
        }
    };

    const markAllRead = async (type?: 'USER' | 'ADMIN') => {
        try {
            await api.markAllRead(type);
            setNotifications(prev => prev.map(n => (!type || n.type === type || (!n.type && type === 'USER')) ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Mark all read failed:', err);
        }
    };

    const clearAll = async (type?: 'USER' | 'ADMIN') => {
        try {
            await api.clearNotifications(type);
            setNotifications(prev => prev.filter(n => (type && n.type !== type && !(!n.type && type === 'USER'))));
            if (!type) setNotifications([]);
        } catch (err) {
            console.error('Clear all failed:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, clearAll, refreshNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}
