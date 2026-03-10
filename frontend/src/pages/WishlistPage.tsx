import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import Skeleton from '../components/Skeleton';
import { FiHeart, FiArrowLeft, FiX, FiShoppingBag, FiStar } from 'react-icons/fi';

const BACKEND = 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images) : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

export default function WishlistPage() {
    const { wishlist, loading, toggleWishlist } = useWishlist();
    const { addToast } = useToast();
    const { addItem } = useCart();

    if (loading && wishlist.length === 0) return (
        <div style={{ padding: 'var(--space-10) 0' }}>
            <div className="container">
                <div className="products-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="product-card">
                            <Skeleton height="300px" style={{ aspectRatio: '1' }} />
                            <div style={{ padding: 16 }}>
                                <Skeleton height={20} width="70%" style={{ marginBottom: 8 }} />
                                <Skeleton height={40} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FiArrowLeft /> Back to Store
                    </button>
                </div>
                <h1 className="section-title" style={{ marginBottom: 32 }}>My Wishlist <FiHeart style={{ verticalAlign: 'middle', fontSize: '1.5rem', opacity: 0.6 }} /></h1>

                {wishlist.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-16) 0' }}>
                        <div className="empty-state__icon" style={{ fontSize: '4rem', opacity: 0.1, color: 'var(--color-primary)' }}><FiStar /></div>
                        <h2 className="empty-state__title" style={{ fontSize: '2rem' }}>You haven't saved any favorites yet</h2>
                        <p style={{ maxWidth: 400, margin: '12px auto' }}>
                            Love something? Tap the heart icon on any product to save it here for later.
                        </p>
                        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>Explore Collection</Link>
                    </div>
                ) : (
                    <div className="products-grid">
                        {wishlist.map(item => {
                            const p = item.product;
                            if (!p) return null;
                            const img = getImage(p.images);
                            return (
                                <div key={item.id} className="product-card">
                                    <Link to={`/products/${p.id}`} style={{ display: 'block' }}>
                                        <div className="product-card__image-wrap">
                                            <img src={img} alt={p.name} className="product-card__image" />
                                        </div>
                                        <div className="product-card__body">
                                            {p.category?.name && <p className="product-card__category">{p.category.name}</p>}
                                            <h3 className="product-card__name">{p.name}</h3>
                                            <div className="product-card__footer">
                                                <span className="product-card__price">₹{p.price.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                            onClick={() => { addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, image: img }); addToast(`${p.name} added to cart!`, 'success'); }}
                                        >
                                            <FiShoppingBag /> Add to Cart
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--color-error)' }}
                                            onClick={() => toggleWishlist(p.id)}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
