import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Skeleton from '../components/Skeleton';
import { FiFileText, FiCheckCircle, FiPackage, FiTruck, FiHome, FiArrowLeft } from 'react-icons/fi';
import './OrdersPage.css';

const STATUS_STEPS = [
    { key: 'PLACED', label: 'Placed', icon: <FiFileText /> },
    { key: 'ACCEPTED', label: 'Accepted', icon: <FiCheckCircle /> },
    { key: 'PREPARING', label: 'Preparing', icon: <FiPackage /> },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: <FiTruck /> },
    { key: 'DELIVERED', label: 'Delivered', icon: <FiHome /> },
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getMyOrders()
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="orders-page fade-in">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FiArrowLeft /> Back to Home
                    </button>
                </div>
                <Skeleton height={40} width={200} style={{ marginBottom: 32 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={140} borderRadius={16} />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="orders-page fade-in">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FiArrowLeft /> Back to Home
                    </button>
                </div>
                <h1 className="section-title" style={{ marginBottom: 32 }}>My Orders</h1>

                {orders.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-16) 0' }}>
                        <div className="empty-state__icon" style={{ fontSize: '4rem', opacity: 0.1, color: 'var(--color-primary)' }}><FiPackage /></div>
                        <h2 className="empty-state__title" style={{ fontSize: '2rem' }}>No orders found</h2>
                        <p style={{ maxWidth: 400, margin: '12px auto' }}>You haven't placed any orders yet. Discover our handmade gifts and place your first order!</p>
                        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>Start Shopping</Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const stepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
                            return (
                                <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                                    <div className="order-card__header">
                                        <div>
                                            <div className="label-text">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                                            <div style={{ fontSize: '0.83rem', color: 'var(--color-muted)', marginTop: 2 }}>
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                ₹{order.totalAmount.toLocaleString('en-IN')}
                                            </div>
                                            <span className={`badge badge-${order.status === 'DELIVERED' ? 'success' : order.status === 'PLACED' ? 'warning' : 'info'}`}>
                                                {STATUS_STEPS[stepIdx]?.icon} {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini Status Tracker */}
                                    <div className="order-card__tracker">
                                        {STATUS_STEPS.map((step, i) => (
                                            <div
                                                key={step.key}
                                                className={`order-card__step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}
                                            >
                                                <div className="order-card__step-dot">{i < stepIdx ? <FiCheckCircle /> : step.icon}</div>
                                                <span className="order-card__step-label">{step.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-card__items">
                                        {order.orderItems.slice(0, 3).map((item: any) => (
                                            <span key={item.id} className="order-card__item">{item.product.name}</span>
                                        ))}
                                        {order.orderItems.length > 3 && <span className="order-card__item">+{order.orderItems.length - 3} more</span>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
