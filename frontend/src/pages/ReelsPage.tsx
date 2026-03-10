import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import './ReelsPage.css';

const BACKEND = 'http://localhost:5001';

function getVideoUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BACKEND}${url}`;
}

/* ---- Sub-components for Reels ---- */
const ReelVideo = ({ reel }: { reel: any }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.play().catch(() => { });
                    } else {
                        videoRef.current.pause();
                    }
                }
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div className="reel-card" onClick={() => setIsExpanded(true)}>
                <video
                    ref={videoRef}
                    src={getVideoUrl(reel.videoUrl)}
                    loop
                    muted
                    playsInline
                    className="reel-video"
                />
                <div className="reel-card__overlay">
                    <div className="reel-card__play">▶</div>
                    <h4 className="reel-card__title">{reel.title || 'Crafted Moment'}</h4>
                </div>
            </div>

            {isExpanded && (
                <div className="reel-modal" onClick={() => setIsExpanded(false)}>
                    <div className="reel-modal__content" onClick={e => e.stopPropagation()}>
                        <button className="reel-modal__close" onClick={() => setIsExpanded(false)}>✕</button>
                        <video
                            src={getVideoUrl(reel.videoUrl)}
                            controls
                            autoPlay
                            className="reel-modal__video"
                        />
                        {reel.title && <h3 className="reel-modal__title">{reel.title}</h3>}
                    </div>
                </div>
            )}
        </>
    );
};

export default function ReelsPage() {
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getReels()
            .then(res => setReels(res || []))
            .catch(err => console.error('Fetch error:', err))
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
    }, [reels]);

    if (loading) {
        return (
            <div className="reels-page reels-page--loading">
                <div className="container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="reels-page fade-in">
            <section className="reels-hero">
                <div className="container">
                    <div className="section-header" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span>←</span> Back to Home
                            </button>
                        </div>
                        <span className="label-text" style={{ display: 'inline-block', marginTop: 40 }}>Process In Motion</span>
                        <h1 className="reels-page__title">Crafted Moments</h1>
                        <p className="section-subtitle">A glimpse into the artistry and care behind every single creation.</p>
                    </div>
                </div>
            </section>

            <section className="reels-grid-section">
                <div className="container">
                    {reels.length > 0 ? (
                        <div className="reels-grid">
                            {reels.map((reel) => (
                                <div key={reel.id} className="scroll-animate">
                                    <ReelVideo reel={reel} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="reels-empty-container scroll-animate">
                            <div className="reels-empty-card">
                                <div className="reels-empty__visual">
                                    <div className="reels-empty__placeholder">
                                        <div className="reels-empty__play-btn">▶</div>
                                    </div>
                                    <div className="reels-empty__placeholder-mini"></div>
                                    <div className="reels-empty__placeholder-mini"></div>
                                </div>
                                <div className="reels-empty__content">
                                    <span className="reels-empty__badge">Coming Soon</span>
                                    <h3 className="reels-empty__text">No crafted moments shared yet.</h3>
                                    <p className="reels-empty__sub">
                                        We're busy at the workshop creating magic. Check back soon for a
                                        glimpse into our creative process!
                                    </p>
                                    <div className="reels-empty__actions">
                                        <a
                                            href="https://instagram.com/_whiffandwrap_"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                        >
                                            Follow on Instagram
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
