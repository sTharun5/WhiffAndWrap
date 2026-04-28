import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { openInstagramDM } from '../utils/InstagramOrderHelper';
import { FiInstagram, FiStar, FiX, FiSearch } from 'react-icons/fi';

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
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [haptic, setHaptic] = useState(false);

    const image = getImage(product.images);
    const rating = Math.round(product.avgRating || 0);

    const handleOrder = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            addToast('Please sign in to place an order', 'info');
            return;
        }

        const opts = Array.isArray(product.personalizationOptions)
            ? product.personalizationOptions
            : (typeof product.personalizationOptions === 'string' ? JSON.parse(product.personalizationOptions || '[]') : []);

        if (opts.length > 0) {
            addToast('Please fill in personalization details first', 'info');
            return; // Link wrapper will handle navigation to detail page
        }

        const isConfirmed = await confirm({
            title: 'Order via Instagram',
            message: 'To place your order, the Product ID and details MUST be copied. Click below to copy them and open Instagram, then paste them into the DM.',
            confirmText: 'Copy & Open Instagram',
            cancelText: 'Cancel'
        });

        if (isConfirmed) {
            openInstagramDM({
                id: product.id,
                name: product.name,
                description: product.description || '',
                price: product.price,
                image: image
            });
            addToast('Product ID Copied! Paste it in the Instagram DM.', 'success');
            setHaptic(true);
            setTimeout(() => setHaptic(false), 300);
        }
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
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage(image);
                        }}
                        style={{ cursor: 'zoom-in' }}
                        title="Click to view full image"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'; }}
                    />
                </div>
                <div className="product-card__body">
                    {product.category?.name && (
                        <p className="product-card__category">{product.category.name}</p>
                    )}
                    <h3 className="product-card__name">{product.name}</h3>
                    <p className="product-card__description" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-light)',
                        minHeight: '2.5rem'
                    }}>
                        {product.description || 'No description available'}
                    </p>
                    <div className="product-card__footer">
                        <span className="product-card__price">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.isAvailable === false && (
                            <span className="badge badge-error" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Out of Stock</span>
                        )}
                    </div>
                    <button 
                        className={`btn btn-primary product-card__atc ${haptic ? 'animate-haptic' : ''} ${product.isAvailable === false ? 'btn-disabled' : ''}`}
                        style={{ 
                            width: '100%', 
                            marginTop: '16px',
                            backgroundColor: product.isAvailable === false ? 'var(--color-muted)' : '#E1306C', 
                            borderColor: product.isAvailable === false ? 'var(--color-muted)' : '#E1306C', 
                            opacity: product.isAvailable === false ? 0.6 : 1 
                        }}
                        onClick={(e) => product.isAvailable !== false && handleOrder(e)}
                        disabled={product.isAvailable === false}
                    >
                        <FiInstagram style={{ marginRight: 8 }} /> {product.isAvailable === false ? 'Unavailable' : 'Copy & Order'}
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
                            <FiX /> Close
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
