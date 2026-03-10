import { useState, useRef, useEffect } from 'react';
import { useAuth, CURRENT_TERMS_VERSION } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import './TermsModal.css';

export default function TermsModal() {
    const { user, refresh, logout } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.scrollHeight <= contentRef.current.clientHeight + 10) {
                setHasScrolledToBottom(true);
            }
        }
    }, [user]);

    // Only show if user is logged in, but hasn't accepted current terms
    if (!user || user.termsVersion === CURRENT_TERMS_VERSION) {
        return null;
    }

    const handleAccept = async () => {
        setLoading(true);
        try {
            await api.acceptTerms();
            addToast('Terms and Conditions accepted. Welcome!', 'success');
            await refresh(); // Refresh user context to pick up the new termsVersion
        } catch (err: any) {
            addToast(err.message || 'Failed to accept terms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        addToast('You must accept the Terms and Conditions to use this platform.', 'error');
        logout();
    };

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal">
                <div className="terms-modal__header">
                    <h2>Terms and Conditions Update</h2>
                    <p>Please review our latest Terms and Conditions and Privacy Policy to continue using Whiff & Wrap.</p>
                </div>

                <div
                    className="terms-modal__content"
                    ref={contentRef}
                    onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                        if (scrollHeight - Math.ceil(scrollTop) <= clientHeight + 30) {
                            setHasScrolledToBottom(true);
                        }
                    }}
                >
                    <h3>1. Introduction</h3>
                    <p>Welcome to Whiff & Wrap! These Terms and Conditions govern your use of our platform and services. By accessing or using our website, you agree to be bound by these Terms.</p>

                    <h3>2. User Accounts & Registration</h3>
                    <p>You must provide accurate and complete information when creating an account. You are responsible for safeguarding your login credentials and for any activities or actions under your account.</p>

                    <h3>3. Purchases & Payments</h3>
                    <p>All prices are indicated on our platform. We reserve the right to change prices at any time. Placing an order constitutes a binding offer to purchase the specified handmade products.</p>

                    <h3>4. Personalization & Handicrafts</h3>
                    <p>Because our products are meticulously handcrafted and often personalized, slight variations from product photographs may occur. These are considered features, not flaws.</p>

                    <h3>5. Privacy Policy & Data Usage</h3>
                    <p>We respect your privacy. By using our platform, you consent to our collection, use, and sharing of personal data as outlined in our Privacy Policy, tailored strictly to complete your orders and improve our service.</p>

                    <h3>6. Modifications to Terms</h3>
                    <p>We reserve the right to modify these Terms at any time. When we do, we will require you to accept the updated Terms prior to accessing your dashboard.</p>
                </div>

                <div className="terms-modal__actions">
                    <button className="btn btn-outline" onClick={handleDecline} disabled={loading}>
                        Decline & Logout
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAccept}
                        disabled={loading || !hasScrolledToBottom}
                        title={!hasScrolledToBottom ? "Please scroll to the bottom to accept" : ""}
                    >
                        {loading ? <span className="spinner" /> : 'I Accept'}
                    </button>
                </div>
            </div>
        </div>
    );
}
