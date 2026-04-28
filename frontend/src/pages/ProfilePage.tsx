import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiPackage, FiHeart, FiLogOut } from 'react-icons/fi';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    if (!user) return null;

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container" style={{ maxWidth: 640 }}>
                <span className="label-text">Account</span>
                <h1 className="section-title" style={{ marginBottom: 32, marginTop: 6 }}>My Profile</h1>

                <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                        {user.image
                            ? <img src={user.image} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                            : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>{user.name[0]}</div>
                        }
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700 }}>{user.name}</h2>
                            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                            <span className={`badge badge-${user.role === 'ADMIN' ? 'primary' : 'success'}`} style={{ marginTop: 8, display: 'inline-flex' }}>
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>Full Name</span>
                            <span style={{ fontWeight: 700 }}>{user.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>Email</span>
                            <span style={{ fontWeight: 700 }}>{user.email}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <Link to="/orders" className="card" style={{ padding: 'var(--space-6)', display: 'block', textDecoration: 'none', transition: 'all 0.25s ease' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--color-primary)' }}><FiPackage /></div>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text)' }}>My Orders</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 4 }}>Track your handmade gifts</p>
                    </Link>
                    <Link to="/wishlist" className="card" style={{ padding: 'var(--space-6)', display: 'block', textDecoration: 'none', transition: 'all 0.25s ease' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--color-primary)' }}><FiHeart /></div>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text)' }}>My Wishlist</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 4 }}>Saved items you love</p>
                    </Link>
                </div>

                <button
                    onClick={logout}
                    className="btn btn-outline"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                >
                    <FiLogOut /> Sign Out
                </button>
            </div>
        </div>
    );
}
