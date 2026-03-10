import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import Alert from '../components/Alert';
import Skeleton from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import './ProductDetailPage.css';

const BACKEND = 'http://localhost:5001';
function getImages(images: any): string[] {
    if (!images) return [];
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images) : []);
    return list.map((u: string) => u.startsWith('http') ? u : `${BACKEND}${u}`);
}

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [personalization, setPersonalization] = useState<Record<string, string>>({});
    const [userImage, setUserImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const { addItem } = useCart();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [haptic, setHaptic] = useState(false);
    const navigate = useNavigate();

    const wishlisted = id ? isWishlisted(id) : false;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getProduct(id)
            .then(setProduct)
            .catch(() => addToast('Product not found', 'error'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="pd-page">
            <div className="container pd-page__inner">
                <div className="pd-gallery">
                    <Skeleton height={500} borderRadius={16} />
                    <div className="pd-gallery__thumbs" style={{ marginTop: 16 }}>
                        <Skeleton width={80} height={80} circle />
                        <Skeleton width={80} height={80} circle />
                        <Skeleton width={80} height={80} circle />
                    </div>
                </div>
                <div className="pd-info">
                    <Skeleton height={40} width="80%" style={{ marginBottom: 16 }} />
                    <Skeleton height={20} width="40%" style={{ marginBottom: 12 }} />
                    <Skeleton height={60} style={{ marginBottom: 16 }} />
                    <Skeleton height={150} style={{ marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Skeleton height={50} width={120} borderRadius="var(--radius-full)" />
                        <Skeleton height={50} style={{ flex: 1 }} borderRadius="var(--radius-full)" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (!product) return null;

    const images = getImages(product.images);
    if (images.length === 0) images.push('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600');

    const opts: string[] = Array.isArray(product.personalizationOptions)
        ? product.personalizationOptions
        : (typeof product.personalizationOptions === 'string' ? JSON.parse(product.personalizationOptions) : []);

    const avgRating = product.reviews?.length
        ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
        : null;

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: images[0],
            personalizationData: { ...personalization, ...(userImage ? { custom_image: userImage } : {}) },
        });
        setHaptic(true);
        setTimeout(() => setHaptic(false), 300);
        addToast(`${product.name} added to cart 🛍`, 'success');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = await api.uploadImage(file);
            setUserImage(data.url);
            addToast('Image uploaded!', 'success');
        } catch { addToast('Upload failed', 'error'); }
        finally { setUploading(false); }
    };

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { addToast('Please sign in to review', 'info'); return; }
        setSubmittingReview(true);
        try {
            await api.addReview(product.id, { rating, comment });
            addToast('Review submitted! ✓', 'success');
            setRating(0); setComment('');
            const updated = await api.getProduct(product.id);
            setProduct(updated);
        } catch (err: any) { addToast(err.message, 'error'); }
        finally { setSubmittingReview(false); }
    };

    const handleWishlist = async () => {
        if (!user) { addToast('Please sign in to use wishlist', 'info'); return; }
        if (!id) return;
        try {
            await toggleWishlist(id);
            addToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️', 'success');
        } catch { addToast('Could not update wishlist', 'error'); }
    };

    return (
        <div className="pd-page fade-in">
            <div className="container">
                {/* Breadcrumb & Back */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>←</span> Back
                    </button>
                    <nav className="pd-breadcrumb" style={{ marginBottom: 0 }}>
                        <button onClick={() => navigate('/')}>Home</button>
                        <span>/</span>
                        <button onClick={() => navigate('/products')}>Products</button>
                        <span>/</span>
                        <span>{product.name}</span>
                    </nav>
                </div>

                <div className="pd-page__inner">
                    {/* Gallery */}
                    <div className="pd-gallery">
                        <div className="pd-gallery__main">
                            <img src={images[activeImage]} alt={product.name} className="pd-gallery__main-img" onClick={() => setPreviewImage(images[activeImage])} style={{ cursor: 'zoom-in' }} title="Click to view full image" />
                        </div>
                        {images.length > 1 && (
                            <div className="pd-gallery__thumbs">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`pd-gallery__thumb ${i === activeImage ? 'active' : ''}`}
                                        onClick={() => {
                                            if (i === activeImage) setPreviewImage(img);
                                            else setActiveImage(i);
                                        }}
                                        title={i === activeImage ? "Click to zoom" : "Click to view"}
                                    >
                                        <img src={img} alt="" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="pd-info">
                        {product.category?.name && (
                            <span className="label-text">{product.category.name}</span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <h1 className="pd-info__title">{product.name}</h1>
                            <button
                                className={`pd-info__wishlist ${wishlisted ? 'active' : ''} ${haptic ? 'animate-haptic' : ''}`}
                                onClick={handleWishlist}
                                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                style={{
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '50%',
                                    width: 44,
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.4rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    color: wishlisted ? 'var(--color-primary)' : 'var(--color-text-light)',
                                    marginTop: 4
                                }}
                            >
                                {wishlisted ? '❤️' : '♡'}
                            </button>
                        </div>

                        {avgRating && (
                            <div className="pd-info__rating">
                                <span className="stars">{'★'.repeat(Math.round(avgRating))}</span>
                                <span className="pd-info__rating-text">{avgRating.toFixed(1)} ({product.reviews?.length} reviews)</span>
                            </div>
                        )}

                        <div className="pd-info__price" style={{ marginBottom: 16 }}>₹{product.price.toLocaleString('en-IN')}</div>

                        <Alert variant="info" title="Made to Order 🌸" icon="✂️">
                            Every item is carefully handcrafted from scratch. Please place your order <strong>6–7 days in advance</strong> to allow time for creation and delivery.
                        </Alert>

                        <p className="pd-info__desc" style={{ marginTop: 24 }}>{product.description}</p>

                        {product.materials && (
                            <div className="pd-info__materials">
                                <strong>Materials:</strong> {product.materials}
                            </div>
                        )}
                        {/* Personalization */}
                        {opts.length > 0 && (
                            <div className="pd-personalization">
                                <h3 className="pd-personalization__title">Personalize Your Gift ✨</h3>
                                <Alert variant="tip" icon="💡">
                                    Add personal touches — names, messages, or your own photo. We craft each one by hand.
                                </Alert>
                                <div style={{ marginTop: 12 }} />
                                {opts.map(opt => (
                                    <div key={opt} className="form-group" style={{ marginBottom: 12 }}>
                                        {opt === 'custom_image' ? (
                                            <>
                                                <label className="form-label">Upload Custom Image</label>
                                                <input type="file" accept="image/*,.heic,.heif" onChange={handleImageUpload} className="form-input" />
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>Supports JPG, PNG, WebP & HEIC (iPhone photos) · Max 15 MB</p>
                                                {uploading && (
                                                    <div className="alert-strip alert-strip--info" style={{ marginTop: 6 }}>⏳ Processing your image…</div>
                                                )}
                                                {userImage && (
                                                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <img
                                                            src={`${BACKEND}${userImage}`}
                                                            alt="Preview"
                                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }}
                                                            onClick={() => setPreviewImage(`${BACKEND}${userImage}`)}
                                                            title="Click to zoom"
                                                            loading="lazy"
                                                        />
                                                        <div className="alert-strip alert-strip--success">✅ Image uploaded successfully!</div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <label className="form-label">{opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder={`Enter ${opt.replace(/_/g, ' ')}`}
                                                    value={personalization[opt] || ''}
                                                    onChange={e => setPersonalization(p => ({ ...p, [opt]: e.target.value }))}
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quantity & Cart */}
                        <div className="pd-actions">
                            <div className="pd-qty">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="pd-qty__btn">−</button>
                                <span className="pd-qty__val">{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(100, q + 1))} className="pd-qty__btn">+</button>
                            </div>
                            <button
                                className={`btn btn-primary btn-lg ${haptic ? 'animate-haptic' : ''}`}
                                style={{ flex: 1 }}
                                onClick={handleAddToCart}
                            >
                                Add to Cart 🛍
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => { navigate('/cart'); handleAddToCart(); }}>
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <section className="pd-reviews">
                    <h2 className="section-title" style={{ marginBottom: 24 }}>Reviews & Ratings</h2>

                    {avgRating && (
                        <div className="pd-reviews__summary">
                            <div className="pd-reviews__avg">{avgRating.toFixed(1)}</div>
                            <div>
                                <div className="stars" style={{ fontSize: '1.5rem' }}>
                                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                                </div>
                                <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>Based on {product.reviews?.length} reviews</p>
                            </div>
                        </div>
                    )}

                    {user && (
                        <form onSubmit={handleReview} className="pd-review-form">
                            <h3>Write a Review</h3>
                            <div className="pd-star-picker">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} type="button" onClick={() => setRating(s)} style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer', color: s <= rating ? '#F5B942' : '#ddd' }}>★</button>
                                ))}
                            </div>
                            <textarea
                                className="form-input form-textarea"
                                placeholder="Share your experience..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={!rating || submittingReview}>
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    )}

                    <div className="pd-reviews__list">
                        {product.reviews?.map((r: any) => (
                            <div key={r.id} className="pd-review-item">
                                <div className="pd-review-item__header">
                                    {r.user.image
                                        ? <img src={r.user.image} alt="" className="pd-review-item__avatar" />
                                        : <div className="pd-review-item__avatar pd-review-item__avatar--initials">{r.user.name[0]}</div>
                                    }
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>{r.user.name}</strong>
                                        <div className="stars" style={{ fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {r.comment && <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: 8 }}>{r.comment}</p>}
                            </div>
                        ))}
                        {(!product.reviews || product.reviews.length === 0) && (
                            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
                                <div className="empty-state__icon">⭐</div>
                                <p className="empty-state__title">No reviews yet. Be the first!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
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
        </div>
    );
}
