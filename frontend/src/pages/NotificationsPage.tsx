import { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiArrowLeft } from 'react-icons/fi';

export default function NotificationsPage() {
    const { notifications, loading, markRead, markAllRead } = useNotifications();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'USER' | 'ADMIN'>('USER');

    if (loading && notifications.length === 0) {
        return (
            <div className="container" style={{ padding: 'var(--space-12) 0' }}>
                <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 12 }} />
                ))}
            </div>
        );
    }

    const filteredNotifications = notifications.filter(n => n.type === activeTab || (!n.type && activeTab === 'USER'));

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FiArrowLeft /> Back to Home
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h1 className="section-title" style={{ margin: 0 }}>Notifications <FiBell style={{ verticalAlign: 'middle', fontSize: '1.5rem', opacity: 0.6 }} /></h1>
                    {filteredNotifications.some(n => !n.read) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => markAllRead(activeTab)}>
                            Mark all as read
                        </button>
                    )}
                </div>

                {user?.role === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                        <button
                            className={`btn ${activeTab === 'USER' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('USER')}
                        >
                            Personal
                        </button>
                        <button
                            className={`btn ${activeTab === 'ADMIN' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('ADMIN')}
                        >
                            Store Updates
                            {notifications.filter(n => !n.read && n.type === 'ADMIN').length > 0 && (
                                <span style={{ background: 'var(--color-error)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: 8 }}>
                                    {notifications.filter(n => !n.read && n.type === 'ADMIN').length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon"><FiBell /></div>
                        <h2 className="empty-state__title">No notifications yet</h2>
                        <p>We'll notify you about your orders and other updates here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[...filteredNotifications].reverse().map(n => (
                            <div
                                key={n.id}
                                className={`notification-item ${!n.read ? 'unread' : ''}`}
                                onClick={() => !n.read && markRead(n.id)}
                                style={{
                                    padding: 'var(--space-5) var(--space-6)',
                                    background: n.read ? 'white' : 'var(--color-cream)',
                                    borderRadius: 16,
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4
                                }}
                            >
                                {!n.read && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: 'var(--color-primary)'
                                    }} />
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: !n.read ? 16 : 0 }}>
                                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>
                                        {n.title}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text-light)',
                                    margin: 0,
                                    lineHeight: 1.5,
                                    marginLeft: !n.read ? 16 : 0
                                }}>
                                    {n.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
