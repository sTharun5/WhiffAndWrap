import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Alert from '../components/Alert';
import './CartPage.css';

export default function CartPage() {
    const { items, removeItem, updateQty, clearCart, totalPrice } = useCart();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [placing, setPlacing] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [showPhoneStep, setShowPhoneStep] = React.useState(false);
    const [haptic, setHaptic] = React.useState(false);
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [agreedToPolicies, setAgreedToPolicies] = React.useState(false);

    const handleCheckout = async () => {
        if (!user) { navigate('/auth'); return; }

        if (!showPhoneStep) {
            setHaptic(true);
            setTimeout(() => setHaptic(false), 300);
            setShowPhoneStep(true);
            return;
        }

        if (!phoneNumber || phoneNumber.length < 10) {
            addToast('Please enter a valid phone number', 'error');
            return;
        }

        if (!agreedToPolicies) {
            addToast('Please agree to our Store Policies to proceed', 'error');
            return;
        }

        setPlacing(true);
        try {
            const orderItems = items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                personalizationData: i.personalizationData || null,
            }));
            const order = await api.placeOrder({ items: orderItems, phoneNumber });
            clearCart();
            addToast('Order placed successfully! 🎉', 'success');
            navigate(`/orders/${order.id}`);
        } catch (err: any) {
            addToast(err.message || 'Failed to place order', 'error');
        } finally {
            setPlacing(false);
        }
    };

    if (items.length === 0) return (
        <div className="cart-page fade-in">
            <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                    <div className="empty-state__icon" style={{ fontSize: '5rem', opacity: 0.8 }}>🛍️</div>
                    <h2 className="empty-state__title" style={{ fontSize: '2rem', marginTop: 16 }}>Your cart feels a bit light</h2>
                    <p style={{ maxWidth: 400, margin: '12px auto', color: 'var(--color-text-light)' }}>
                        Discover our collection of handcrafted gifts, preserved bouquets, and more to find the perfect gift.
                    </p>
                    <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>Explore Our Collection</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="cart-page fade-in">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>←</span> Back to Store
                    </button>
                </div>
                <div className="cart-page__header">
                    <h1 className="section-title">Shopping Cart</h1>
                    <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear All</button>
                </div>

                <div className="cart-page__layout">
                    {/* Items */}
                    <div className="cart-items">
                        {items.map(item => (
                            <div key={item.productId} className="cart-item">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="cart-item__img"
                                    onClick={() => setPreviewImage(item.image)}
                                    style={{ cursor: 'zoom-in' }}
                                    title="Click to zoom"
                                />
                                <div className="cart-item__info">
                                    <h3 className="cart-item__name">{item.name}</h3>
                                    <p className="cart-item__price">₹{item.price.toLocaleString('en-IN')}</p>
                                    {item.personalizationData && Object.keys(item.personalizationData).length > 0 && (
                                        <div className="cart-item__personalization">
                                            {Object.entries(item.personalizationData).map(([k, v]) => (
                                                <span key={k}>{k.replace(/_/g, ' ')}: <strong>{String(v).slice(0, 30)}</strong></span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="cart-item__qty">
                                    <button onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                                </div>
                                <div className="cart-item__subtotal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                <button className="cart-item__remove" onClick={() => removeItem(item.productId)} title="Remove">✕</button>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="cart-summary card">
                        {!showPhoneStep ? (
                            <>
                                <h2 className="cart-summary__title">Order Summary</h2>
                                <div className="cart-summary__row">
                                    <span>Subtotal</span>
                                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <Alert variant="success" icon="🚚" title="Free delivery included">
                                    No hidden charges — we deliver to your door at no extra cost.
                                </Alert>
                                <div className="cart-summary__row cart-summary__total">
                                    <span>Total</span>
                                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <button
                                    className={`btn btn-primary ${haptic ? 'animate-haptic' : ''}`}
                                    style={{ width: '100%', marginTop: 16 }}
                                    onClick={handleCheckout}
                                    disabled={placing}
                                >
                                    Proceed to Checkout 🎁
                                </button>
                            </>
                        ) : (
                            <div className="phone-step fade-in">
                                <h2 className="cart-summary__title">Contact Information</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 16 }}>
                                    Please provide a phone number so we can coordinate your delivery.
                                </p>
                                <div className="form-group" style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}>+91</span>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Enter 10-digit number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            style={{ paddingLeft: 45, width: '100%', height: 48 }}
                                            autoFocus
                                        />
                                        <div className="cart-policy-agreement">
                                            <label className="checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    checked={agreedToPolicies}
                                                    onChange={(e) => setAgreedToPolicies(e.target.checked)}
                                                />
                                                <span className="checkbox-mark"></span>
                                                <span className="checkbox-text">
                                                    I have read and agree to the <Link to="/policies" target="_blank">Store Policies</Link>, including the Cancellation & Refund Policy.
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ flex: 1 }}
                                                onClick={() => setShowPhoneStep(false)}
                                                disabled={placing}
                                            >
                                                Back
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ flex: 2 }}
                                                onClick={handleCheckout}
                                                disabled={placing || phoneNumber.length < 10 || !agreedToPolicies}
                                            >
                                                {placing ? <><span className="spinner" /> Placing Order...</> : 'Place Order 🎁'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div style={{ marginTop: 12 }}>
                                <Alert variant="info" icon="🔐">
                                    You'll need to <strong>sign in</strong> before placing your order.
                                </Alert>
                            </div>
                        )}
                    </div>
                </div>
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
