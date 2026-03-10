const API_BASE = 'http://localhost:5001/api';

function getToken() {
    return sessionStorage.getItem('ww_token');
}

async function request(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include' // Allow cookies to be sent along with JSON token fallback
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        if (err.code === 'SESSION_TERMINATED') {
            window.dispatchEvent(new CustomEvent('session-terminated', { detail: err.error }));
        }
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export const api = {
    // Auth
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    googleLogin: (body: any) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    acceptTerms: () => request('/auth/accept-terms', { method: 'POST' }),

    // Products
    getProducts: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/products${qs}`);
    },
    getProduct: (id: string) => request(`/products/${id}`),

    // Categories
    getCategories: () => request('/categories'),

    // Orders
    placeOrder: (body: any) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
    getMyOrders: () => request('/orders/my'),
    getOrder: (id: string) => request(`/orders/${id}`),

    // Wishlist
    getWishlist: () => request('/wishlist'),
    addWishlist: (productId: string) => request(`/wishlist/${productId}`, { method: 'POST' }),
    removeWishlist: (productId: string) => request(`/wishlist/${productId}`, { method: 'DELETE' }),

    // Reviews
    getReviews: (productId: string) => request(`/reviews/${productId}`),
    addReview: (productId: string, body: any) => request(`/reviews/${productId}`, { method: 'POST', body: JSON.stringify(body) }),

    // Notifications
    getNotifications: () => request('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: (type?: string) => request(`/notifications/read-all${type ? `?type=${type}` : ''}`, { method: 'PATCH' }),

    // Admin
    admin: {
        getProducts: () => request('/admin/products'),
        createProduct: (body: any) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
        updateProduct: (id: string, body: any) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
        deleteProduct: (id: string) => request(`/admin/products/${id}`, { method: 'DELETE' }),
        getOrders: () => request('/admin/orders'),
        updateOrder: (id: string, body: any) => request(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
        getUsers: () => request('/admin/users'),
        getAnalytics: () => request('/admin/analytics'),
        createCategory: (body: any) => request('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
        deleteCategory: (id: string) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
    },

    // Upload
    uploadImage: async (file: File) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },
    uploadImages: async (files: File[]) => {
        const token = getToken();
        const formData = new FormData();
        files.forEach(f => formData.append('images', f));
        const res = await fetch(`${API_BASE}/upload/images`, {
            method: 'POST',
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },
};
