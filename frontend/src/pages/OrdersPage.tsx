import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FiPackage, FiClock, FiCheck, FiX, FiTruck, FiShoppingBag } from 'react-icons/fi';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=120';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PLACED:           { label: 'Order Placed',      color: 'var(--color-info)',    icon: <FiClock /> },
    ACCEPTED:         { label: 'Accepted',           color: 'var(--color-success)', icon: <FiCheck /> },
    PREPARING:        { label: 'Preparing',          color: 'var(--color-warning)', icon: <FiScissors /> },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery',   color: 'var(--color-warning)', icon: <FiTruck /> },
    DELIVERED:        { label: 'Delivered',          color: 'var(--color-success)', icon: <FiCheck /> },
    REJECTED:         { label: 'Rejected',           color: 'var(--color-error)',   icon: <FiX /> },
};

function FiScissors() { return <span>✂️</span>; }

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api.getMyOrders()
            .then(setOrders)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) return null;

    return (
        <div className="fade-in" style={{ padding: 'var(--space-10) 0 var(--space-16)' }}>
            <div className="container" style={{ maxWidth: 860 }}>
                <div style={{ marginBottom: 32 }}>
                    <span className="label-text">Account</span>
                    <h1 className="section-title" style={{ marginTop: 6 }}>My Orders</h1>
                    <p style={{ color: 'var(--color-muted)', marginTop: 4 }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon"><FiShoppingBag /></div>
                        <h2 className="empty-state__title">No orders yet</h2>
                        <p>When you place an order, it will appear here.</p>
                        <a href="/products" className="btn btn-primary" style={{ marginTop: 24 }}>Browse Products</a>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {orders.map(order => {
                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
                            return (
                                <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 8 }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Order ID</p>
                                            <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', marginTop: 2 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: `${cfg.color}18`, color: cfg.color, fontWeight: 700, fontSize: '0.75rem' }}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {order.orderItems?.map((item: any) => (
                                            <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                                <img src={getImage(item.product?.images)} alt={item.product?.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</p>
                                                </div>
                                                <p style={{ fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>₹{(item.quantity * item.price).toLocaleString('en-IN')}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-cream)', flexWrap: 'wrap', gap: 8 }}>
                                        <div style={{ display: 'flex', gap: 24 }}>
                                            {order.deliveryDate && (
                                                <div>
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Est. Delivery</p>
                                                    <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            )}
                                            {order.rejectionReason && (
                                                <div>
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason</p>
                                                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-error)' }}>{order.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Total</p>
                                            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
