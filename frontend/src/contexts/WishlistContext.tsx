import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
    wishlist: any[];
    loading: boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    isWishlisted: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshWishlist = async () => {
        if (!user) {
            setWishlist([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.getWishlist();
            setWishlist(data);
        } catch (err) {
            console.error('Failed to fetch wishlist:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshWishlist();
    }, [user]);

    const toggleWishlist = async (productId: string) => {
        if (!user) return;

        const exists = wishlist.some(i => i.productId === productId);
        try {
            if (exists) {
                await api.removeWishlist(productId);
                setWishlist(prev => prev.filter(i => i.productId !== productId));
            } else {
                const newItem = await api.addWishlist(productId);
                setWishlist(prev => [...prev, newItem]);
            }
        } catch (err) {
            console.error('Wishlist toggle failed:', err);
            throw err;
        }
    };

    const isWishlisted = (productId: string) => {
        return wishlist.some(i => i.productId === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, isWishlisted, refreshWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
}
