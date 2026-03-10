import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useWishlist } from '../contexts/WishlistContext';

interface Props {
    product: any;
}

const BACKEND = 'http://localhost:5001';

function getImage(images: any): string {
    if (!images) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images) : []);
    if (list.length === 0) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
    const url = list[0];
    return url.startsWith('http') ? url : `${BACKEND}${url}`;
}

export default function ProductCard({ product }: Props) {
    const { user } = useAuth();
    const { addItem } = useCart();
    const { addToast } = useToast();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [adding, setAdding] = useState(false);
    const [haptic, setHaptic] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const image = getImage(product.images);
    const wishlisted = isWishlisted(product.id);
    const stars = '★'.repeat(Math.round(product.avgRating || 0)) + '☆'.repeat(5 - Math.round(product.avgRating || 0));

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { addToast('Please sign in to use wishlist', 'info'); return; }
        try {
            setHaptic(true);
            setTimeout(() => setHaptic(false), 300);
            await toggleWishlist(product.id);
            if (wishlisted) {
                addToast('Removed from wishlist', 'info');
            } else {
                addToast('Added to wishlist ❤️', 'success');
            }
        } catch { addToast('Could not update wishlist', 'error'); }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAdding(true);
        addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, image });
        addToast(`${product.name} added to cart 🛍`, 'success');
        setTimeout(() => setAdding(false), 800);
    };

    const handlePreview = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewImage(image);
    };

    return (
        <>
            <Link to={`/products/${product.id}`} className="product-card" style={{ display: 'block' }}>
                <div className="product-card__image-wrap">
                    <img
                        src={image}
                        alt={product.name}
                        className="product-card__image"
                        loading="lazy"
                        onClick={handlePreview}
                        style={{ cursor: 'zoom-in' }}
                        title="Click to view full image"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'; }}
                    />
                    <button
                        className={`product-card__wishlist ${wishlisted ? 'active' : ''} ${haptic ? 'animate-haptic' : ''}`}
                        onClick={handleWishlist}
                        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        {wishlisted ? '❤️' : '♡'}
                    </button>
                </div>
                <div className="product-card__body">
                    {product.category?.name && (
                        <p className="product-card__category">{product.category.name}</p>
                    )}
                    <h3 className="product-card__name">{product.name}</h3>
                    <div className="product-card__footer">
                        <span className="product-card__price">₹{product.price.toLocaleString('en-IN')}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            {product.avgRating && (
                                <span className="product-card__rating">
                                    <span className="stars" style={{ fontSize: '0.75rem' }}>{stars.slice(0, 5)}</span>
                                    <span style={{ color: 'var(--color-muted)' }}>({product.reviewCount})</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className={`btn btn-primary ${adding ? 'animate-haptic' : ''}`}
                        style={{ width: '100%', marginTop: 12 }}
                        onClick={handleAddToCart}
                        disabled={adding}
                    >
                        {adding ? '✓ Added!' : 'Add to Cart 🛍'}
                    </button>
                </div>
            </Link>

            {previewImage && (
                <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setPreviewImage(null)}>
                    <div style={{ position: 'relative', width: '90vw', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                background: 'white',
                                color: 'var(--color-text)',
                                zIndex: 2,
                                borderRadius: 'var(--radius-full)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                padding: '8px 16px'
                            }}
                            onClick={() => setPreviewImage(null)}
                        >
                            ✕ Close
                        </button>
                        <img
                            src={previewImage}
                            alt="Full Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: 12,
                                boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                                background: 'var(--color-cream)'
                            }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
