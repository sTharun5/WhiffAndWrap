import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FiShoppingBag, FiKey, FiGift, FiHeart, FiStar, FiInstagram, FiTruck, FiAward, FiShield, FiArrowLeft, FiArrowRight, FiZap
} from 'react-icons/fi';
import { api } from '../lib/api';
import './HomePage.css';

const CATEGORIES = [
    { name: 'Bouquets', icon: <FiGift />, desc: 'Preserved & fresh bouquets' },
    { name: 'Keychains', icon: <FiKey />, desc: 'Personalized & handcrafted' },
    { name: 'Gift Wraps', icon: <FiShoppingBag />, desc: 'Elegant custom wrapping' },
    { name: 'Personalized Crafts', icon: <FiZap />, desc: 'Your name, your story' },
    { name: 'Custom Gifts', icon: <FiStar />, desc: 'Unique handmade gifts' },
];

const BACKEND = 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

export default function HomePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const navigate = useNavigate();
    const { hash } = useLocation();

    const heroSlides = [
        {
            title: 'Gifts that Touch',
            subtitle: 'the Heart',
            desc: 'Discover handcrafted bouquets, personalized gifts, and artisan creations made with love.',
            cta: 'Explore Our Collection',
            bg: 'linear-gradient(135deg, #F5ECE6 0%, #EDE0F5 100%)',
            accent: '#8B4A73',
            link: '/products',
            image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800'
        },
        {
            title: 'Every Gift,',
            subtitle: 'a Memory',
            desc: 'From preserved roses to custom keychains — crafted to last a lifetime.',
            cta: 'Shop Keychains',
            bg: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8D0 100%)',
            accent: '#C9956A',
            link: '/products?category=Keychains',
            image: 'https://images.unsplash.com/photo-1582133637202-f4976efee14c?auto=format&fit=crop&q=80&w=800'
        },
        {
            title: 'Personalize',
            subtitle: 'With Love',
            desc: 'Add names, messages, and photos to create truly one-of-a-kind gifts.',
            cta: 'Personalize Now',
            bg: 'linear-gradient(135deg, #EAF5EC 0%, #E2F5E8 100%)',
            accent: '#4A9B6F',
            link: '/products',
            image: 'https://images.unsplash.com/photo-1512418431373-cf1456e17352?auto=format&fit=crop&q=80&w=800'
        },
    ];

    useEffect(() => {
        const count = products.length > 0 ? products.length : heroSlides.length;
        const timer = setInterval(() => setHeroIndex(i => (i + 1) % count), 5000);
        return () => clearInterval(timer);
    }, [products, heroSlides.length]);

    useEffect(() => {
        api.getProducts({ limit: '10' })
            .then(prodRes => {
                setProducts(prodRes.products || []);
            }).catch(err => console.error('Fetch error:', err))
            .finally(() => setLoading(false));
    }, []);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Run once
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [products]);

    const activeProduct = products[heroIndex] || null;

    // Fallback static slide while loading or if no products
    const slide = activeProduct ? {
        title: activeProduct.name,
        subtitle: `₹${activeProduct.price.toLocaleString('en-IN')}`,
        desc: activeProduct.description,
        cta: 'View Details',
        bg: 'linear-gradient(135deg, #F5ECE6 0%, #EDE0F5 100%)',
        accent: '#8B4A73',
        image: getImage(activeProduct.images),
        link: `/products/${activeProduct.id}`
    } : heroSlides[0];

    const nextSlide = () => {
        const count = products.length > 0 ? products.length : heroSlides.length;
        setHeroIndex((heroIndex + 1) % count);
    };

    const prevSlide = () => {
        const count = products.length > 0 ? products.length : heroSlides.length;
        setHeroIndex((heroIndex - 1 + count) % count);
    };

    return (
        <div className="home-page fade-in">
            {/* Hero Section */}
            <section className="hero" style={{ background: slide.bg }}>
                <div className="container hero__inner">
                    <div className="hero__content" key={`content-${heroIndex}`}>
                        <span className="label-text hero-animate-1" style={{ color: slide.accent }}>Handmade with <FiHeart /> Love</span>
                        <h1 className="hero__title hero-animate-2">
                            {slide.title}<br />
                            <span className="hero__title-accent" style={{ color: slide.accent }}>{slide.subtitle}</span>
                        </h1>
                        <p className="hero__desc hero-animate-3">{slide.desc}</p>
                        <div className="hero__actions hero-animate-4">
                            <Link to={slide.link} className="btn btn-primary btn-lg">{slide.cta}</Link>
                            <Link to="/products" className="btn btn-secondary btn-lg">Browse All</Link>
                        </div>
                    </div>
                    <div className="hero__visual hero-animate-visual" key={`visual-${heroIndex}`}>
                        {slide.image ? (
                            <Link to={slide.link} className="hero__image-wrapper">
                                <div className="hero__product-container">
                                    <img src={slide.image} alt={slide.title} className="hero__product-image" />
                                </div>
                            </Link>
                        ) : (
                            <div className="hero__product-container hero__product-container--fallback">
                            </div>
                        )}
                    </div>
                </div>

                {/* Hero Navigation Arrows */}
                {products.length > 1 && (
                    <>
                        <button className="hero__nav hero__nav--prev" onClick={prevSlide} aria-label="Previous Slide"><FiArrowLeft /></button>
                        <button className="hero__nav hero__nav--next" onClick={nextSlide} aria-label="Next Slide"><FiArrowRight /></button>
                    </>
                )}

                {/* Hero Indicators */}
                <div className="hero__indicators">
                    {(products.length > 0 ? products : heroSlides).map((_, i) => (
                        <button
                            key={i}
                            className={`hero__indicator ${i === heroIndex ? 'active' : ''}`}
                            onClick={() => setHeroIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* Trust Bar */}
            <section className="trust-bar scroll-animate">
                <div className="container trust-bar__inner">
                    {[
                        {
                            icon: <FiAward />,
                            text: 'Truly Handmade by Us'
                        },
                        {
                            icon: <FiTruck />,
                            text: 'Delivered with Extra Care'
                        },
                        {
                            icon: <FiZap />,
                            text: 'Personalized for Your Story'
                        },
                        {
                            icon: <FiShield />,
                            text: 'Artisan Quality Guaranteed'
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="trust-bar__item">
                            <span className="trust-bar__icon">{item.icon}</span>
                            <span className="trust-bar__text">{item.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="section categories-section scroll-animate">
                <div className="container">
                    <div className="section-header">
                        <span className="label-text">What We Craft</span>
                        <h2 className="section-title" style={{ marginTop: 8 }}>Shop by Category</h2>
                        <p className="section-subtitle">Explore our curated collections of handmade gifts for every occasion.</p>
                    </div>
                    <div className="categories-grid">
                        {CATEGORIES.map((cat, idx) => {
                            const catProduct = products.find(p => p.category?.name === cat.name);
                            const catImage = catProduct ? getImage(catProduct.images) : null;

                            return (
                                <button
                                    key={cat.name}
                                    className={`category-card stagger-${idx + 1}`}
                                    onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                                >
                                    <div className="category-card__visual">
                                        {catImage ? (
                                            <img src={catImage} alt={cat.name} className="category-card__img" />
                                        ) : (
                                            <span className="category-card__icon">{cat.icon}</span>
                                        )}
                                    </div>
                                    <h3 className="category-card__name">{cat.name}</h3>
                                    <p className="category-card__desc">{cat.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section scroll-animate">
                <div className="container story-section__inner">
                    <div className="story-section__visual">
                        <div className="story-section__image">
                            {products.length > 0 ? (
                                <img
                                    src={getImage(products[products.length - 1].images)}
                                    alt="Our Craft"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ fontSize: '3rem', opacity: 0.2 }}><FiHeart /></div>
                            )}
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
            <section className="section instagram-section scroll-animate" style={{ background: 'var(--color-off-white)', padding: 'var(--space-16) 0', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <div className="container">
                    <span className="label-text" style={{ color: 'var(--color-secondary)' }}>Stay Connected</span>
                    <h2 className="section-title" style={{ marginTop: 8, fontSize: '2.5rem' }}>Join Our Instagram Family</h2>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '12px auto 32px' }}>
                        Discover our newest handcrafted gifts, see behind-the-scenes magic, and place custom orders directly through DMs.
                    </p>
                    <div className="instagram-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="https://ig.me/m/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', border: 'none', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiShoppingBag /> Order Us on Instagram
                        </a>
                        <a href="https://instagram.com/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg" style={{ borderColor: '#bc1888', color: '#bc1888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiInstagram /> Follow Us on Instagram
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
