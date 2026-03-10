import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const { wishlist } = useWishlist();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);
    const { confirm } = useConfirm();

    const handleLogout = async () => {
        if (await confirm({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            danger: true,
            confirmText: 'Confirm Logout'
        })) {
            logout();
            navigate('/');
        }
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/products', label: 'Products' },
        { to: '/reels', label: 'Crafted Moments' },
        { to: '/policies', label: 'Policies' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container navbar__inner">
                {/* Logo */}
                <Link to="/" className="navbar__logo">
                    <img src="/logo.png" alt="Whiff & Wrap Logo" className="navbar__logo-img" />
                    <span className="navbar__logo-text">Whiff <span>&</span> Wrap</span>
                </Link>

                {/* Desktop Nav Links */}
                <ul className="navbar__links">
                    {navLinks.map(l => (
                        <li key={l.to}>
                            <Link to={l.to} className={`navbar__link ${location.pathname === l.to ? 'active' : ''}`}>
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right Actions */}
                <div className="navbar__actions">
                    <div className="navbar__desktop-actions">
                        {user && (
                            <>
                                <Link to="/notifications" className="navbar__icon-btn" title="Notifications">
                                    🔔
                                    {unreadCount > 0 && <span className="navbar__cart-badge">{unreadCount}</span>}
                                </Link>
                                <Link to="/wishlist" className="navbar__icon-btn" title="Wishlist">
                                    ♡
                                    {wishlist.length > 0 && <span className="navbar__cart-badge" style={{ background: 'var(--color-secondary)' }}>{wishlist.length}</span>}
                                </Link>
                            </>
                        )}
                        <Link to="/support" className="navbar__icon-btn" title="Help & Support">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </Link>
                    </div>

                    <Link to="/cart" className="navbar__icon-btn navbar__cart-btn" title="Cart">
                        🛍
                        {totalItems > 0 && <span className="navbar__cart-badge">{totalItems}</span>}
                    </Link>

                    {user ? (
                        <div className="navbar__profile" ref={profileRef}>
                            <button
                                className="navbar__profile-btn"
                                onClick={() => setProfileOpen(p => !p)}
                                aria-label="Profile menu"
                            >
                                {user.image
                                    ? <img src={user.image} alt={user.name} className="navbar__avatar" referrerPolicy="no-referrer" />
                                    : <span className="navbar__avatar navbar__avatar--initials">{user.name[0]?.toUpperCase()}</span>
                                }
                                <div className="navbar__profile-info">
                                    <span className="navbar__username">{user.name.split(' ')[0]}</span>
                                    <span className={`navbar__chevron ${profileOpen ? 'open' : ''}`}>▾</span>
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="navbar__dropdown">
                                    <div className="navbar__dropdown-header">
                                        <p className="navbar__dropdown-name">{user.name}</p>
                                        <p className="navbar__dropdown-email">{user.email}</p>
                                    </div>
                                    <div className="navbar__dropdown-divider" />
                                    <Link to="/profile" className="navbar__dropdown-item">👤 My Profile</Link>
                                    <Link to="/orders" className="navbar__dropdown-item">📦 My Orders</Link>
                                    <Link to="/wishlist" className="navbar__dropdown-item">♡ Wishlist</Link>
                                    {user.role === 'ADMIN' && (
                                        <Link to="/admin" className="navbar__dropdown-item">⚙️ Admin Dashboard</Link>
                                    )}
                                    <div className="navbar__dropdown-divider" />
                                    <button className="navbar__dropdown-item navbar__dropdown-logout" onClick={handleLogout}>
                                        ↩ Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
                    )}

                    {/* Mobile Hamburger */}
                    <button
                        className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen(p => !p)}
                        aria-label="Toggle menu"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`navbar__mobile-menu ${menuOpen ? 'open' : ''}`}>
                <div className="navbar__mobile-header">
                    {user ? (
                        <div className="navbar__mobile-user">
                            {user.image
                                ? <img src={user.image} alt={user.name} className="navbar__avatar" referrerPolicy="no-referrer" />
                                : <span className="navbar__avatar navbar__avatar--initials">{user.name[0]?.toUpperCase()}</span>
                            }
                            <div className="navbar__mobile-user-info">
                                <p className="navbar__mobile-user-name">{user.name}</p>
                                <p className="navbar__mobile-user-email">{user.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="navbar__mobile-user">
                            <div className="navbar__avatar navbar__avatar--initials">?</div>
                            <div className="navbar__mobile-user-info">
                                <p className="navbar__mobile-user-name">Welcome Guest</p>
                                <p className="navbar__mobile-user-email">Sign in to manage orders</p>
                            </div>
                        </div>
                    )}
                    <button className="navbar__mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
                </div>

                <div className="navbar__mobile-content">
                    {navLinks.map(l => (
                        <Link key={l.to} to={l.to} className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>{l.label}</Link>
                    ))}
                    <Link to="/support" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Help & Support
                    </Link>
                    <div className="navbar__mobile-divider" />
                    {user ? (
                        <>
                            <Link to="/profile" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                            <Link to="/orders" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>📦 My Orders</Link>
                            <Link to="/notifications" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}</Link>
                            <Link to="/wishlist" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>♡ Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</Link>
                            {user.role === 'ADMIN' && (
                                <Link to="/admin" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>⚙️ Admin Dashboard</Link>
                            )}
                            <div className="navbar__mobile-divider" />
                            <button className="navbar__mobile-link navbar__mobile-logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>↩ Logout</button>
                        </>
                    ) : (
                        <Link to="/auth" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>🔑 Sign In / Register</Link>
                    )}
                </div>
            </div>
            {menuOpen && <div className="navbar__mobile-overlay" onClick={() => setMenuOpen(false)} />}
        </nav>
    );
}
