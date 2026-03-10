import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineSparkles, HiOutlineTruck, HiOutlineHeart } from 'react-icons/hi2';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './AuthPage.css';

declare const google: any;

const GOOGLE_CLIENT_ID = '51013230604-5nvi6vkl1p6mb145j22h44iiaat1hi3d.apps.googleusercontent.com';

type Mode = 'login' | 'register';

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Parse the JWT credential from Google and log in
    const handleGsiCredential = async (response: { credential: string }) => {
        try {
            const parts = response.credential.split('.');
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const data = await api.googleLogin({
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                image: payload.picture,
            });
            login(data.token, data.user);
            addToast(`Welcome back, ${data.user.name?.split(' ')[0]}`, 'success');
            navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
        } catch (err: any) {
            addToast(err.message || 'Google sign-in failed', 'error');
        }
    };

    // Initialize Google Identity Services button
    useEffect(() => {
        const initGsi = () => {
            if (typeof google === 'undefined' || !google?.accounts?.id) return;
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGsiCredential,
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            if (googleBtnRef.current) {
                google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: googleBtnRef.current.offsetWidth || 360,
                    text: 'continue_with',
                    shape: 'pill',
                    logo_alignment: 'left',
                });
            }
        };

        if (typeof google !== 'undefined') {
            initGsi();
        } else {
            const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (script) {
                script.addEventListener('load', initGsi);
                return () => script.removeEventListener('load', initGsi);
            }
        }
    }, [handleGsiCredential]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            let data: any;
            if (mode === 'login') {
                data = await api.login({ email, password });
            } else {
                data = await api.register({ name, email, password, termsAccepted });
            }
            login(data.token, data.user);
            addToast(`Welcome back${data.user.name ? ', ' + data.user.name.split(' ')[0] : ''}`, 'success');
            navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
        } catch (err: any) {
            setFormError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <button
                onClick={() => navigate('/')}
                className="auth-back-btn"
                title="Back to Store"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
                <FiArrowLeft />
                <span className="auth-back-btn__text">Back to Store</span>
            </button>

            <div className="auth-page__left">
                <div className="auth-page__brand">
                    <img src="/logo.png" alt="Whiff & Wrap Logo" className="auth-page__brand-logo" />
                    <h1 className="auth-page__brand-name">Whiff & Wrap</h1>
                    <p className="auth-page__brand-tagline">Handcrafted gifts made with love</p>
                </div>
                <div className="auth-page__features">
                    {[
                        { icon: <HiOutlineShoppingBag />, text: 'Shop unique handmade gifts' },
                        { icon: <HiOutlineSparkles />, text: 'Personalize your orders' },
                        { icon: <HiOutlineTruck />, text: 'Track your deliveries' },
                        { icon: <HiOutlineHeart />, text: 'Save your wishlist' },
                    ].map(f => (
                        <div key={f.text} className="auth-page__feature">
                            <span className="auth-page__feature-icon">{f.icon}</span>
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="auth-page__right">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <h2 className="auth-card__title">{mode === 'login' ? 'Welcome Back' : 'Join Us'}</h2>
                        <p className="auth-card__subtitle">
                            {mode === 'login' ? 'Sign in to your Whiff & Wrap account' : 'Create your Whiff & Wrap account'}
                        </p>
                    </div>

                    <div className="auth-toggle">
                        <button
                            type="button"
                            className={`auth-toggle__btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setFormError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`auth-toggle__btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setFormError(''); }}
                        >
                            Register
                        </button>
                    </div>

                    {/* Official Google Sign-In Button rendered by Google's GSI library — no popup, no redirect URI needed */}
                    <div ref={googleBtnRef} style={{ width: '100%', minHeight: 44, marginBottom: 16, display: 'flex', justifyContent: 'center' }} />

                    <div className="auth-divider"><span>or</span></div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                required
                            />
                        </div>
                        <div className="form-group relative">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="termsCheckbox"
                                    checked={termsAccepted}
                                    onChange={e => setTermsAccepted(e.target.checked)}
                                />
                                <label htmlFor="termsCheckbox">
                                    I agree to the Terms and Conditions and Privacy Policy.
                                </label>
                            </div>
                        )}

                        {formError && (
                            <div className="auth-error-msg">
                                {formError}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 8 }}
                            disabled={loading || (mode === 'register' && !termsAccepted)}
                        >
                            {loading ? <><span className="spinner" />Processing...</> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
