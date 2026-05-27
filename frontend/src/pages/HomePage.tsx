import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiKey, FiGift, FiHeart, FiStar, FiInstagram, FiTruck, FiAward, FiShield, FiZap, FiChevronRight
} from 'react-icons/fi';
import { api } from '../lib/api';
import './HomePage.css';

const CATEGORIES = [
    { name: 'Bouquets', icon: <FiGift />, desc: 'Preserved & fresh bouquets' },
    { name: 'Keychains', icon: <FiKey />, desc: 'Personalized & handcrafted' },
    { name: 'Gift Wraps', icon: <FiGift />, desc: 'Elegant custom wrapping' },
    { name: 'Personalized Crafts', icon: <FiZap />, desc: 'Your name, your story' },
    { name: 'Custom Gifts', icon: <FiStar />, desc: 'Unique handmade gifts' },
];

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

const STATIC_SLIDES = [
    {
        title: 'Gifts that Touch',
        subtitle: 'the Heart',
        desc: 'Discover handcrafted bouquets, personalized gifts, and artisan creations made with love.',
        cta: 'Explore Collection',
        bg: 'linear-gradient(135deg, #F5ECE6 0%, #EDE0F5 100%)',
        accent: '#8B4A73',
        link: '/products',
        image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800',
        tag: 'New Arrivals'
    },
    {
        title: 'Every Gift,',
        subtitle: 'a Memory',
        desc: 'From preserved roses to custom keychains — crafted to last a lifetime.',
        cta: 'Shop Keychains',
        bg: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8D0 100%)',
        accent: '#C9956A',
        link: '/products?category=Keychains',
        image: 'https://images.unsplash.com/photo-1582133637202-f4976efee14c?auto=format&fit=crop&q=80&w=800',
        tag: 'Bestsellers'
    },
    {
        title: 'Personalize',
        subtitle: 'With Love',
        desc: 'Add names, messages, and photos to create truly one-of-a-kind gifts.',
        cta: 'Personalize Now',
        bg: 'linear-gradient(135deg, #EAF5EC 0%, #E2F5E8 100%)',
        accent: '#4A9B6F',
        link: '/products',
        image: 'https://images.unsplash.com/photo-1512418431373-cf1456e17352?auto=format&fit=crop&q=80&w=800',
        tag: 'Custom Made'
    },
];

export default function HomePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();

    // Build slides from products or use static fallback
    const slides = products.length > 0
        ? products.slice(0, 6).map((p, i) => ({
            title: p.name,
            subtitle: `₹${p.price.toLocaleString('en-IN')}`,
            desc: p.description || 'Handcrafted with love for you.',
            cta: 'View Details',
            bg: STATIC_SLIDES[i % STATIC_SLIDES.length].bg,
            accent: STATIC_SLIDES[i % STATIC_SLIDES.length].accent,
            image: getImage(p.images),
            link: `/products/${p.id}`,
            tag: p.category?.name || 'Handmade',
            thumbnail: getImage(p.images),
        }))
        : STATIC_SLIDES.map(s => ({ ...s, thumbnail: s.image }));

    const count = slides.length;

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setHeroIndex(i => (i + 1) % count);
        }, 4500);
    }, [count]);

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startTimer]);

    const goTo = (idx: number) => {
        if (idx === heroIndex || isTransitioning) return;
        setIsTransitioning(true);
        setHeroIndex(idx);
        startTimer();
        setTimeout(() => setIsTransitioning(false), 500);
    };

    useEffect(() => {
        api.getProducts({ limit: '10' })
            .then(res => setProducts(res.products || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [products]);

    const slide = slides[heroIndex] || slides[0];

    return (
        <div className="home-page fade-in">

            {/* ── Hero Section ── */}
            <section className="hero" style={{ background: slide.bg }}>
                <div className="container hero__inner">

                    {/* Left: Content */}
                    <div className="hero__content" key={`content-${heroIndex}`}>
                        <div className="hero__tag hero-animate-1" style={{ color: slide.accent, borderColor: `${slide.accent}30`, background: `${slide.accent}10` }}>
                            <FiHeart size={11} />
                            <span>{slide.tag}</span>
                        </div>
                        <h1 className="hero__title hero-animate-2">
                            {slide.title}<br />
                            <span className="hero__title-accent" style={{ color: slide.accent }}>{slide.subtitle}</span>
                        </h1>
                        <p className="hero__desc hero-animate-3">{slide.desc}</p>
                        <div className="hero__actions hero-animate-4">
                            <Link to={slide.link} className="btn btn-primary btn-lg">
                                {slide.cta} <FiChevronRight size={16} />
                            </Link>
                            <Link to="/products" className="btn btn-ghost btn-lg">Browse All</Link>
                        </div>

                        {/* Thumbnail strip — replaces arrows */}
                        {count > 1 && (
                            <div className="hero__thumbstrip hero-animate-4">
                                {slides.map((s, i) => (
                                    <button
                                        key={i}
                                        className={`hero__thumb ${i === heroIndex ? 'active' : ''}`}
                                        onClick={() => goTo(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                        style={i === heroIndex ? { borderColor: slide.accent, boxShadow: `0 0 0 3px ${slide.accent}30` } : {}}
                                    >
                                        <img src={s.thumbnail} alt="" />
                                        <div className="hero__thumb-active-bar" style={{ background: slide.accent }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Main Image */}
                    <div className="hero__visual hero-animate-visual" key={`visual-${heroIndex}`}>
                        <Link to={slide.link} className="hero__image-wrapper">
                            <div className="hero__product-container" style={{ boxShadow: `0 40px 80px ${slide.accent}22` }}>
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className={`hero__product-image ${isTransitioning ? 'transitioning' : ''}`}
                                />
                                {/* Floating accent blob */}
                                <div className="hero__blob" style={{ background: `${slide.accent}15` }} />
                            </div>
                        </Link>

                        {/* Progress bar */}
                        <div className="hero__progress-track">
                            <div
                                className="hero__progress-bar"
                                key={heroIndex}
                                style={{ background: slide.accent }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Trust Bar ── */}
            <section className="trust-bar scroll-animate">
                <div className="container trust-bar__inner">
                    {[
                        { icon: <FiAward />, text: 'Truly Handmade by Us' },
                        { icon: <FiTruck />, text: 'Delivered with Extra Care' },
                        { icon: <FiZap />, text: 'Personalized for Your Story' },
                        { icon: <FiShield />, text: 'Artisan Quality Guaranteed' },
                    ].map((item, idx) => (
                        <div key={idx} className="trust-bar__item">
                            <span className="trust-bar__icon">{item.icon}</span>
                            <span className="trust-bar__text">{item.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Categories ── */}
            <section className="section categories-section scroll-animate">
                <div className="container">
                    <div className="section-header text-center">
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
                                        {catImage
                                            ? <img src={catImage} alt={cat.name} className="category-card__img" />
                                            : <span className="category-card__icon">{cat.icon}</span>
                                        }
                                    </div>
                                    <h3 className="category-card__name">{cat.name}</h3>
                                    <p className="category-card__desc">{cat.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Story Section ── */}
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
                            Whiff &amp; Wrap was born from a passion for handmade artistry. Every product is carefully crafted,
                            wrapped with care, and delivered with the warmth of a personal touch. We believe the best gifts
                            are the ones made by hand.
                        </p>
                        <Link to="/products" className="btn btn-primary">Shop Our Collection</Link>
                    </div>
                </div>
            </section>

            {/* ── Instagram CTA ── */}
            <section className="section instagram-section scroll-animate">
                <div className="container" style={{ textAlign: 'center' }}>
                    <span className="label-text" style={{ color: 'var(--color-secondary)' }}>Stay Connected</span>
                    <h2 className="section-title" style={{ marginTop: 8, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Join Our Instagram Family</h2>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '12px auto 32px' }}>
                        Discover our newest handcrafted gifts, see behind-the-scenes magic, and place custom orders directly through DMs.
                    </p>
                    <div className="instagram-actions">
                        <a href="https://ig.me/m/_whiffandwrap_" target="_blank" rel="noopener noreferrer"
                            className="btn btn-lg"
                            style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', border: 'none', color: 'white', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <FiInstagram /> Order via Instagram
                        </a>
                        <a href="https://instagram.com/_whiffandwrap_" target="_blank" rel="noopener noreferrer"
                            className="btn btn-secondary btn-lg"
                            style={{ borderColor: '#bc1888', color: '#bc1888', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <FiInstagram /> Follow Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
