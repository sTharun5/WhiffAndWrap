import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { FiHeart, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : [];
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

export default function WishlistPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        api.getWishlist().then(setItems).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (user) load();
    }, [user]);

    const handleRemove = async (productId: string) => {
        try {
            await api.removeWishlist(productId);
            addToast('Removed from wishlist', 'success');
            load();
        } catch {
            addToast('Failed to remove', 'error');
        }
    };

    if (!user) return null;

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container" style={{ maxWidth: 860 }}>
                <div style={{ marginBottom: 32 }}>
                    <span className="label-text">Account</span>
                    <h1 className="section-title" style={{ marginTop: 6 }}>My Wishlist</h1>
                    <p style={{ color: 'var(--color-muted)', marginTop: 4 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
                </div>

                {loading ? (
                    <div className="products-grid">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon"><FiHeart /></div>
                        <h2 className="empty-state__title">Your wishlist is empty</h2>
                        <p>Save items you love and come back to them later.</p>
                        <Link to="/products" className="btn btn-primary" style={{ marginTop: 24 }}>Explore Products</Link>
                    </div>
                ) : (
                    <div className="products-grid">
                        {items.map((item: any) => {
                            const product = item.product || item;
                            return (
                                <div key={item.id} className="product-card" style={{ position: 'relative' }}>
                                    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <div className="product-card__image-wrap">
                                            <img src={getImage(product.images)} alt={product.name} className="product-card__image" />
                                        </div>
                                        <div className="product-card__body">
                                            {product.category && <p className="product-card__category">{product.category.name}</p>}
                                            <h3 className="product-card__name">{product.name}</h3>
                                            <div className="product-card__footer">
                                                <span className="product-card__price">₹{Number(product.price).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(product.id)}
                                        style={{ position: 'absolute', top: 10, right: 10, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color: 'var(--color-error)', fontSize: '1rem' }}
                                        title="Remove from wishlist"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
