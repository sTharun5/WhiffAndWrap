import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import TermsModal from './components/TermsModal';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import ReelsPage from './pages/ReelsPage';
import SupportPage from './pages/SupportPage';
import PolicyPage from './pages/PolicyPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <main className="main-content page-transition" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/policies" element={<PolicyPage />} />
        <Route path="/policies/:slug" element={<PolicyPage />} />
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className={`page-layout ${isAdminPath ? 'admin-theme' : ''}`}>
      <TermsModal />
      <Navbar />
      <AppRoutes />
      {!isAdminPath && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <WishlistProvider>
            <CartProvider>
              <ConfirmProvider>
                <BrowserRouter>
                  <AppLayout />
                </BrowserRouter>
              </ConfirmProvider>
            </CartProvider>
          </WishlistProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
