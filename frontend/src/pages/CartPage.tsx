import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Alert from '../components/Alert';
import {
    FiShoppingBag, FiTruck, FiGift, FiFileText, FiBookOpen, FiClock, FiCheckCircle, FiLock, FiArrowLeft, FiX, FiCheck, FiMinus, FiPlus, FiArrowRight, FiPackage, FiXCircle
} from 'react-icons/fi';
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
    const [showPolicyModal, setShowPolicyModal] = React.useState(false);
    const [hasScrolledPolicy, setHasScrolledPolicy] = React.useState(false);
    const policyScrollRef = React.useRef<HTMLDivElement>(null);

    const handlePolicyScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
        if (atBottom) setHasScrolledPolicy(true);
    };

    const openPolicyModal = () => {
        setHasScrolledPolicy(false);
        setShowPolicyModal(true);
        // Auto-mark as scrolled if content is short enough
        setTimeout(() => {
            const el = policyScrollRef.current;
            if (el && el.scrollHeight <= el.clientHeight + 50) {
                setHasScrolledPolicy(true);
            }
        }, 300);
    };

    const handleCheckout = async () => {
        if (!user) { navigate('/auth'); return; }

        if (!showPhoneStep) {
            setHaptic(true);
            setTimeout(() => setHaptic(false), 300);
            setShowPhoneStep(true);
            return;
        }

        if (!phoneNumber || phoneNumber.length < 10) {
            addToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        if (!agreedToPolicies) {
            addToast('Please read and agree to our Store Policies to proceed', 'error');
            openPolicyModal();
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
            addToast('Order placed successfully!', 'success');
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
                    <div className="empty-state__icon" style={{ fontSize: '4rem', opacity: 0.1, color: 'var(--color-primary)' }}><FiShoppingBag /></div>
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
                        <FiArrowLeft /> Back to Store
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
                                    <button onClick={() => updateQty(item.productId, item.quantity - 1)}><FiMinus /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQty(item.productId, item.quantity + 1)}><FiPlus /></button>
                                </div>
                                <div className="cart-item__subtotal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                <button className="cart-item__remove" onClick={() => removeItem(item.productId)} title="Remove"><FiX /></button>
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
                                <Alert variant="success" icon={<FiTruck />} title="Free delivery included">
                                    No hidden charges — we deliver to your door at no extra cost.
                                </Alert>
                                <div className="cart-summary__row cart-summary__total">
                                    <span>Total</span>
                                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <button
                                    className={`btn btn-primary ${haptic ? 'animate-haptic' : ''}`}
                                    style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                    onClick={handleCheckout}
                                    disabled={placing}
                                >
                                    Proceed to Checkout <FiGift />
                                </button>
                            </>
                        ) : (
                            <div className="phone-step fade-in">
                                <h2 className="cart-summary__title">Contact Information</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 20 }}>
                                    We'll use this number only to coordinate delivery.
                                </p>

                                {/* Phone number field */}
                                <div className="checkout-phone-field" style={{ marginBottom: 20 }}>
                                    <label className="checkout-field-label">Phone Number</label>
                                    <div className="checkout-phone-input-wrap">
                                        <span className="checkout-phone-prefix">+91</span>
                                        <input
                                            type="tel"
                                            className="checkout-phone-input"
                                            placeholder="10-digit mobile number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            maxLength={10}
                                            inputMode="numeric"
                                            autoFocus
                                        />
                                        {phoneNumber.length === 10 && (
                                            <span className="checkout-phone-check"><FiCheck /></span>
                                        )}
                                    </div>
                                    <p className="checkout-field-hint">{phoneNumber.length}/10 digits</p>
                                </div>

                                {/* Policy Agreement */}
                                <div className="checkout-policy-box">
                                    <div className="checkout-policy-icon"><FiFileText /></div>
                                    <div className="checkout-policy-body">
                                        <p className="checkout-policy-title">Store Policies Agreement</p>
                                        <p className="checkout-policy-desc">
                                            You must read and agree to our policies before placing your order.
                                        </p>
                                        {!agreedToPolicies ? (
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm checkout-policy-read-btn"
                                                onClick={openPolicyModal}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                            >
                                                <FiBookOpen /> Read & Agree to Policies
                                            </button>
                                        ) : (
                                            <div className="checkout-policy-agreed">
                                                <span className="checkout-policy-agreed-icon"><FiCheckCircle /></span>
                                                <span>Policies agreed</span>
                                                <button
                                                    type="button"
                                                    className="checkout-policy-revoke"
                                                    onClick={() => setAgreedToPolicies(false)}
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onClick={() => setShowPhoneStep(false)}
                                        disabled={placing}
                                    >
                                        <FiArrowLeft /> Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                        onClick={handleCheckout}
                                        disabled={placing || phoneNumber.length < 10 || !agreedToPolicies}
                                    >
                                        {placing ? <><span className="spinner" /> Placing Order...</> : <><FiGift /> Place Order</>}
                                    </button>
                                </div>

                                {!agreedToPolicies && phoneNumber.length === 10 && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: 10 }}>
                                        Please read and agree to policies to enable Place Order.
                                    </p>
                                )}
                            </div>
                        )}

                        {!user && (
                            <div style={{ marginTop: 12 }}>
                                <Alert variant="info" icon={<FiLock />} title="Security Check">
                                    You'll need to <strong>sign in</strong> before placing your order.
                                </Alert>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setPreviewImage(null)}>
                    <div style={{ position: 'relative', width: '90vw', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ position: 'absolute', top: -10, right: -10, background: 'white', color: 'var(--color-text)', zIndex: 2, borderRadius: 'var(--radius-full)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', padding: '8px 16px' }}
                            onClick={() => setPreviewImage(null)}
                        >
                            <FiX /> Close
                        </button>
                        <img
                            src={previewImage}
                            alt="Full Preview"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 12px 48px rgba(0,0,0,0.6)', background: 'var(--color-cream)' }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Policy Read Modal */}
            {showPolicyModal && (
                <div className="modal-overlay fade-in policy-modal-overlay" onClick={() => setShowPolicyModal(false)}>
                    <div className="policy-modal" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="policy-modal__header">
                            <div>
                                <div style={{ fontSize: '1.5rem', marginBottom: 4, color: 'var(--color-primary)' }}><FiFileText /></div>
                                <h2 className="policy-modal__title">Store Policies</h2>
                                <p className="policy-modal__subtitle">Please read carefully before agreeing.</p>
                            </div>
                            <button className="policy-modal__close" onClick={() => setShowPolicyModal(false)}><FiX /></button>
                        </div>

                        {/* Scrollable content */}
                        <div
                            className="policy-modal__body"
                            ref={policyScrollRef}
                            onScroll={handlePolicyScroll}
                        >
                            <div className="policy-modal__section">
                                <h3><FiXCircle style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-error)' }} /> Cancellation & Refund Policy</h3>
                                <p>Due to the customized and handcrafted nature of our products, <strong>all sales are final</strong> once your order has been accepted and production has begun.</p>
                                <p>We do <strong>not offer cancellations, refunds, or exchanges</strong> unless the item arrives damaged or defective due to shipping. Please ensure all personalization details are correct before placing your order.</p>
                                <p>In the event of a damaged item, please contact us within 48 hours of delivery with photographic evidence.</p>
                            </div>

                            <div className="policy-modal__section">
                                <h3><FiTruck style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} /> Shipping & Delivery Policy</h3>
                                <p>We process and dispatch orders within 2–5 business days. Delivery timelines thereafter depend on your location and the courier service.</p>
                                <p>We are <strong>not responsible for delays</strong> caused by courier services, adverse weather conditions, or incorrect addresses provided at checkout. Please ensure your delivery address and contact number are accurate.</p>
                            </div>

                            <div className="policy-modal__section">
                                <h3><FiLock style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-info)' }} /> Privacy & Personal Data</h3>
                                <p>We collect your phone number strictly for order fulfillment and delivery coordination. We do <strong>not share your personal data</strong> with third parties for marketing or any other purposes.</p>
                            </div>

                            <div className="policy-modal__section">
                                <h3><FiPackage style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-success)' }} /> Order Acceptance</h3>
                                <p>By clicking "I Agree to All Policies" below, you acknowledge that you have read and understood all the above policies and accept them in full.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="policy-modal__footer">
                            {!hasScrolledPolicy && (
                                <p className="policy-modal__scroll-hint"><FiArrowRight style={{ transform: 'rotate(90deg)' }} /> Scroll down to read all policies before agreeing</p>
                            )}
                            <button
                                className="btn btn-primary btn-lg policy-modal__agree-btn"
                                disabled={!hasScrolledPolicy}
                                onClick={() => {
                                    setAgreedToPolicies(true);
                                    setShowPolicyModal(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                            >
                                {hasScrolledPolicy ? <><FiCheckCircle /> I Agree to All Policies</> : 'Scroll to read all policies'}
                            </button>
                            <button className="btn btn-ghost policy-modal__decline-btn" onClick={() => setShowPolicyModal(false)}>
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
