import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const CATEGORIES = [
    { name: 'Bouquets', icon: '💐', desc: 'Preserved & fresh bouquets' },
    { name: 'Keychains', icon: '🔑', desc: 'Personalized & handcrafted' },
    { name: 'Gift Wraps', icon: '🎁', desc: 'Elegant custom wrapping' },
    { name: 'Personalized Crafts', icon: '✨', desc: 'Your name, your story' },
    { name: 'Custom Gifts', icon: '🌟', desc: 'Unique handmade gifts' },
];

export default function HomePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const navigate = useNavigate();

    const heroSlides = [
        {
            title: 'Gifts that Touch',
            subtitle: 'the Heart',
            desc: 'Discover handcrafted bouquets, personalized gifts, and artisan creations made with love.',
            cta: 'Explore Our Collection',
            bg: 'linear-gradient(135deg, #F5ECE6 0%, #EDE0F5 100%)',
            accent: '#8B4A73',
        },
        {
            title: 'Every Gift,',
            subtitle: 'a Memory',
            desc: 'From preserved roses to custom keychains — crafted to last a lifetime.',
            cta: 'Shop Keychains',
            bg: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8D0 100%)',
            accent: '#C9956A',
        },
        {
            title: 'Personalize',
            subtitle: 'With Love',
            desc: 'Add names, messages, and photos to create truly one-of-a-kind gifts.',
            cta: 'Personalize Now',
            bg: 'linear-gradient(135deg, #EAF5EC 0%, #E2F5E8 100%)',
            accent: '#4A9B6F',
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroSlides.length), 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        api.getProducts({ limit: '8' })
            .then(data => setProducts(data.products || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const slide = heroSlides[heroIndex];

    return (
        <div className="home-page fade-in">
            {/* Hero Section */}
            <section className="hero" style={{ background: slide.bg }}>
                <div className="container hero__inner">
                    <div className="hero__content">
                        <span className="label-text" style={{ color: slide.accent }}>Handmade with 🌸 Love</span>
                        <h1 className="hero__title">
                            {slide.title}<br />
                            <span className="hero__title-accent" style={{ color: slide.accent }}>{slide.subtitle}</span>
                        </h1>
                        <p className="hero__desc">{slide.desc}</p>
                        <div className="hero__actions">
                            <Link to="/products" className="btn btn-primary btn-lg">{slide.cta}</Link>
                            <Link to="/products" className="btn btn-secondary btn-lg">Browse All</Link>
                        </div>
                    </div>
                    <div className="hero__visual">
                        <div className="hero__blob">
                            <span className="hero__emoji">🌸</span>
                        </div>
                        <div className="hero__floats">
                            <div className="hero__float hero__float--1">💐</div>
                            <div className="hero__float hero__float--2">🎁</div>
                            <div className="hero__float hero__float--3">✨</div>
                        </div>
                    </div>
                </div>
                {/* Hero Indicators */}
                <div className="hero__indicators">
                    {heroSlides.map((_, i) => (
                        <button
                            key={i}
                            className={`hero__indicator ${i === heroIndex ? 'active' : ''}`}
                            onClick={() => setHeroIndex(i)}
                        />
                    ))}
                </div>
            </section>

            {/* Trust Bar */}
            <section className="trust-bar">
                <div className="container trust-bar__inner">
                    {[
                        { icon: '🤝', text: 'Handcrafted with Love' },
                        { icon: '🚗', text: 'Doorstep Delivery' },
                        { icon: '🎨', text: 'Fully Customizable' },
                        { icon: '⭐', text: 'Premium Quality' },
                    ].map(item => (
                        <div key={item.text} className="trust-bar__item">
                            <span className="trust-bar__icon">{item.icon}</span>
                            <span className="trust-bar__text">{item.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="section categories-section">
                <div className="container">
                    <div className="section-header">
                        <span className="label-text">What We Craft</span>
                        <h2 className="section-title" style={{ marginTop: 8 }}>Shop by Category</h2>
                        <p className="section-subtitle">Explore our curated collections of handmade gifts for every occasion.</p>
                    </div>
                    <div className="categories-grid">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                className="category-card"
                                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                            >
                                <span className="category-card__icon">{cat.icon}</span>
                                <h3 className="category-card__name">{cat.name}</h3>
                                <p className="category-card__desc">{cat.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="section products-section">
                <div className="container">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <span className="label-text">Handpicked For You</span>
                            <h2 className="section-title" style={{ marginTop: 8 }}>Featured Gifts</h2>
                        </div>
                        <Link to="/products" className="btn btn-secondary">View All →</Link>
                    </div>

                    {loading ? (
                        <div className="products-grid">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="product-card">
                                    <div className="skeleton" style={{ aspectRatio: '1', borderRadius: '0' }} />
                                    <div style={{ padding: 16 }}>
                                        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                                        <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 12 }} />
                                        <div className="skeleton" style={{ height: 14, width: '40%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container story-section__inner">
                    <div className="story-section__visual">
                        <div className="story-section__image">
                            <span style={{ fontSize: '6rem' }}>🌸</span>
                        </div>
                    </div>
                    <div className="story-section__content">
                        <span className="label-text">Our Story</span>
                        <h2 className="section-title" style={{ marginTop: 8 }}>Crafted with Purpose,<br />Given with Love</h2>
                        <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginTop: 16, marginBottom: 24 }}>
                            Whiff & Wrap was born from a passion for handmade artistry. Every product is carefully crafted,
                            wrapped with care, and delivered with the warmth of a personal touch. We believe the best gifts
                            are the ones made by hand.
                        </p>
                        <Link to="/products" className="btn btn-primary">Shop Our Collection</Link>
                    </div>
                </div>
            </section>

            {/* Instagram CTA Section */}
            <section className="section instagram-section" style={{ background: 'var(--color-off-white)', padding: 'var(--space-16) 0', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <div className="container">
                    <span className="label-text" style={{ color: 'var(--color-secondary)' }}>Stay Connected</span>
                    <h2 className="section-title" style={{ marginTop: 8, fontSize: '2.5rem' }}>Join Our Instagram Family</h2>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '12px auto 32px' }}>
                        Discover our newest handcrafted gifts, see behind-the-scenes magic, and place custom orders directly through DMs.
                    </p>
                    <div className="instagram-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="https://ig.me/m/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', border: 'none', color: 'white', fontWeight: 600 }}>
                            🛍️ Order Us on Instagram
                        </a>
                        <a href="https://instagram.com/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg" style={{ borderColor: '#bc1888', color: '#bc1888', fontWeight: 600 }}>
                            📸 Follow Us on Instagram
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
