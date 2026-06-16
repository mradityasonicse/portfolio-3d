import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../../store/authStore';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, isLoading, restore } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading admin panel…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="admin-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </div>
  );
}
