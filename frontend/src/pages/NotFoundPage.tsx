import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';

export default function NotFoundPage() {
    return (
        <div className="fade-in" style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
            <div className="container">
                <div style={{ fontSize: '4rem', marginBottom: 24, opacity: 0.1, color: 'var(--color-primary)' }}><FiSearch /></div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', color: 'var(--color-primary)', marginBottom: 16 }}>404</h1>
                <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 12 }}>Page Not Found</h2>
                <p style={{ color: 'var(--color-muted)', marginBottom: 32 }}>The page you're looking for doesn't exist or has been moved.</p>
                <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
            </div>
        </div>
    );
}
