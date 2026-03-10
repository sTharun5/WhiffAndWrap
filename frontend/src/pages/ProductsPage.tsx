import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        api.getCategories().then(setCategories).catch(() => { });
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const params: any = { page: String(page), limit: '12' };
            if (search) params.search = search;
            if (category) params.category = category;

            try {
                const data = await api.getProducts(params);
                setProducts(data.products || []);
                setTotal(data.total || 0);
                setPages(data.pages || 1);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search, category, page]);

    const setParam = (key: string, value: string) => {
        const p = new URLSearchParams(searchParams);
        if (value) p.set(key, value); else p.delete(key);
        p.delete('page');
        setSearchParams(p);
    };

    return (
        <div className="products-page fade-in">
            <div className="products-page__hero">
                <div className="container">
                    <span className="label-text">Our Crafts</span>
                    <h1 className="section-title" style={{ marginTop: 8, color: 'white' }}>All Products</h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>{total} handcrafted items</p>
                </div>
            </div>

            <div className="container products-page__body">
                {/* Filters */}
                <aside className="products-page__sidebar">
                    <div className="products-page__filter-group">
                        <h3 className="products-page__filter-title">Search</h3>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search gifts..."
                            value={search}
                            onChange={e => setParam('search', e.target.value)}
                        />
                    </div>
                    <div className="products-page__filter-group">
                        <h3 className="products-page__filter-title">Categories</h3>
                        <button
                            className={`products-page__cat-btn ${!category ? 'active' : ''}`}
                            onClick={() => setParam('category', '')}
                        >All</button>
                        {categories.map((c: any) => (
                            <button
                                key={c.id}
                                className={`products-page__cat-btn ${category === c.name ? 'active' : ''}`}
                                onClick={() => setParam('category', c.name)}
                            >
                                {c.name}
                                <span className="products-page__cat-count">{c._count?.products}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Grid */}
                <div className="products-page__main">
                    {loading ? (
                        <div className="products-grid">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="product-card">
                                    <div className="skeleton" style={{ aspectRatio: '1' }} />
                                    <div style={{ padding: 16 }}>
                                        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                                        <div className="skeleton" style={{ height: 16, marginBottom: 12 }} />
                                        <div className="skeleton" style={{ height: 32 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">🔍</div>
                            <h3 className="empty-state__title">No products found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="products-page__pagination">
                            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    className={`products-page__page-btn ${p === page ? 'active' : ''}`}
                                    onClick={() => {
                                        const ps = new URLSearchParams(searchParams);
                                        ps.set('page', String(p));
                                        setSearchParams(ps);
                                    }}
                                >{p}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
