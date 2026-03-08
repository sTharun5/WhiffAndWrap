import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const STATUS_STEPS = [
    { key: 'PLACED', label: 'Order Placed', icon: '📝' },
    { key: 'ACCEPTED', label: 'Order Accepted', icon: '✓' },
    { key: 'PREPARING', label: 'Preparing Gift', icon: '🎁' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚗' },
    { key: 'DELIVERED', label: 'Delivered', icon: '🏠' },
];

const BACKEND = 'http://localhost:5001';

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.getOrder(id)
            .then(setOrder)
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ padding: 'var(--space-10) 0' }}>
            <div className="container">
                <div className="skeleton" style={{ height: 60, marginBottom: 16, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 16 }} />
                <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
            </div>
        </div>
    );

    if (!order) return (
        <div className="container" style={{ padding: 'var(--space-16) 0' }}>
            <div className="empty-state">
                <div className="empty-state__icon">❌</div>
                <p className="empty-state__title">Order not found</p>
                <Link to="/orders" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Orders</Link>
            </div>
        </div>
    );

    const stepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <Link to="/orders" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: 24, display: 'inline-block' }}>
                    ← Back to Orders
                </Link>

                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div className="label-text">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 2 }}>
                                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                            {order.deliveryDate && (
                                <div style={{ textAlign: 'right' }}>
                                    <div className="label-text" style={{ color: 'var(--color-success)' }}>Estimated Delivery</div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                                        {new Date(order.deliveryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Tracker */}
                    <div style={{ padding: 'var(--space-6)' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: 24 }}>Order Progress</h3>
                        <div className="status-tracker">
                            {STATUS_STEPS.map((step, i) => (
                                <div key={step.key} className={`status-step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                                    <div className="status-step__dot">{i < stepIdx ? '✓' : step.icon}</div>
                                    <span className="status-step__label">{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)' }}>Items Ordered</h3>
                    </div>
                    {order.orderItems.map((item: any) => {
                        const images = Array.isArray(item.product.images) ? item.product.images : JSON.parse(item.product.images || '[]');
                        const img = images[0] ? (images[0].startsWith('http') ? images[0] : `${BACKEND}${images[0]}`) : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200';
                        return (
                            <div key={item.id} style={{ display: 'flex', gap: 16, padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-light)', alignItems: 'center' }}>
                                <img src={img} alt={item.product.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: 'var(--color-cream)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.product.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                                    {item.personalizationData && Object.keys(item.personalizationData).length > 0 && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginTop: 4 }}>
                                            {Object.entries(item.personalizationData).map(([k, v]) => typeof v === 'string' && <span key={k}>{k.replace(/_/g, ' ')}: {v.slice(0, 30)} </span>)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                            </div>
                        );
                    })}
                    <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
