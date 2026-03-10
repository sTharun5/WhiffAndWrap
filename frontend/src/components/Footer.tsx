import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__grid">
                    {/* Brand Section */}
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <img src="/logo.png" alt="Whiff & Wrap Logo" className="footer__logo-img" />
                            <span>Whiff & Wrap</span>
                        </Link>
                        <p className="footer__tagline">
                            Handcrafting moments of joy. From preserved bouquets to personalized gifts, we craft every detail with purpose and love.
                        </p>
                        <div className="footer__social">
                            <a href="https://instagram.com/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                    </div>

                    {/* Shop Section */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Shop Collections</h4>
                        <ul className="footer__col-links">
                            <li><Link to="/products">All Creations</Link></li>
                            <li><Link to="/products?category=Bouquets">Preserved Bouquets</Link></li>
                            <li><Link to="/products?category=Keychains">Custom Keychains</Link></li>
                            <li><Link to="/products?category=Personalized+Crafts">Handmade Crafts</Link></li>
                        </ul>
                    </div>

                    {/* Account Section */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Your Account</h4>
                        <ul className="footer__col-links">
                            <li><Link to="/profile">Profile Overview</Link></li>
                            <li><Link to="/orders">Track Orders</Link></li>
                            <li><Link to="/wishlist">Your Wishlist</Link></li>
                            <li><Link to="/cart">Shopping Bag</Link></li>
                        </ul>
                    </div>

                    {/* Support Section */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Customer Support</h4>
                        <ul className="footer__col-links">
                            <li><Link to="/support">Help & FAQs</Link></li>
                            <li><a href="mailto:stharun612@gmail.com">Email Us</a></li>
                            <li><Link to="/support">Report an Issue</Link></li>
                            <li className="footer__contact-info">
                                <span>Based in Coimbatore, India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>© 2025 Whiff & Wrap. All rights reserved.</p>
                    <p>Made with  for all the craft lovers.</p>
                </div>
            </div>
        </footer>
    );
}
