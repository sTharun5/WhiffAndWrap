import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__grid">
                    {/* Brand */}
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <img src="/519350388_17845389072528262_7307843047216242767_n.jpg" alt="Whiff & Wrap Logo" className="footer__logo-img" />
                            <span>Whiff & Wrap</span>
                        </Link>
                        <p className="footer__tagline">
                            Handcrafted with love. Every gift tells a story.
                        </p>
                        <div className="footer__social">
                            <a href="#" aria-label="Instagram" className="footer__social-link">📸</a>
                            <a href="#" aria-label="Pinterest" className="footer__social-link">📌</a>
                            <a href="#" aria-label="Facebook" className="footer__social-link">📘</a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Shop</h4>
                        <ul className="footer__col-links">
                            <li><Link to="/products">All Products</Link></li>
                            <li><Link to="/products?category=Bouquets">Bouquets</Link></li>
                            <li><Link to="/products?category=Keychains">Keychains</Link></li>
                            <li><Link to="/products?category=Custom+Gifts">Custom Gifts</Link></li>
                        </ul>
                    </div>

                    <div className="footer__col">
                        <h4 className="footer__col-title">Account</h4>
                        <ul className="footer__col-links">
                            <li><Link to="/auth">Sign In</Link></li>
                            <li><Link to="/profile">My Profile</Link></li>
                            <li><Link to="/orders">My Orders</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                        </ul>
                    </div>

                    <div className="footer__col">
                        <h4 className="footer__col-title">Contact</h4>
                        <ul className="footer__col-links">
                            <li><a href="mailto:stharun612@gmail.com">stharun612@gmail.com</a></li>
                            <li><span>Handmade with ❤️ from India</span></li>
                        </ul>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>© 2025 Whiff & Wrap. All rights reserved.</p>
                    <p>Made with 🌸 for all the craft lovers.</p>
                </div>
            </div>
        </footer>
    );
}
