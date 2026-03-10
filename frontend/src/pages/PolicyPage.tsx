import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Skeleton from '../components/Skeleton';
import './PolicyPage.css';

export default function PolicyPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [policy, setPolicy] = useState<any>(null);
    const [allPolicies, setAllPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch current policy if slug exists, otherwise just the list
                if (slug) {
                    const data = await api.getPolicy(slug);
                    setPolicy(data);
                }
                const list = await api.getPolicies();
                setAllPolicies(list);
                setError(false);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return (
        <div className="policy-page container">
            <div className="policy-layout">
                <aside className="policy-sidebar">
                    <Skeleton height={30} width="80%" style={{ marginBottom: 20 }} />
                    <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
                    <Skeleton height={20} width="70%" style={{ marginBottom: 12 }} />
                </aside>
                <main className="policy-content">
                    <Skeleton height={40} width="50%" style={{ marginBottom: 24 }} />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} height={20} style={{ marginBottom: 12 }} />
                    ))}
                </main>
            </div>
        </div>
    );

    if (error || (!slug && allPolicies.length === 0)) return (
        <div className="policy-page container empty-state">
            <h2>No Policies Found</h2>
            <p>We're currently updating our store policies. Please check back later.</p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
    );

    // If no slug, show the list of policies
    if (!slug) return (
        <div className="policy-page container">
            <div className="policy-header" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>←</span> Back to Home
                    </button>
                </div>
                <h1 className="section-title" style={{ marginTop: 40 }}>Store Policies</h1>
                <p className="section-subtitle">Transparency and trust are the foundation of Whiff & Wrap.</p>
            </div>
            <div className="policy-grid">
                {allPolicies.map(p => (
                    <Link key={p.id} to={`/policies/${p.slug}`} className="policy-card">
                        <h3>{p.title}</h3>
                        <span className="policy-card__link">Read Policy →</span>
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <div className="policy-page container">
            <div className="policy-layout">
                <aside className="policy-sidebar">
                    <h4>All Policies</h4>
                    <nav>
                        {allPolicies.map(p => (
                            <Link
                                key={p.id}
                                to={`/policies/${p.slug}`}
                                className={`policy-sidebar__link ${p.slug === slug ? 'active' : ''}`}
                            >
                                {p.title}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <main className="policy-content">
                    <button
                        onClick={() => navigate('/policies')}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
                    >
                        <span>←</span> Back to Policies
                    </button>
                    <h1 className="policy-title">{policy.title}</h1>
                    <div className="policy-meta">Last updated: {new Date(policy.updatedAt).toLocaleDateString()}</div>
                    <div
                        className="policy-text-content"
                        style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--color-text)' }}
                    >
                        {policy.content}
                    </div>
                </main>
            </div>
        </div>
    );
}
