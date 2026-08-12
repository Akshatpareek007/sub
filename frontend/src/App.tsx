import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ChallansPage } from './pages/ChallansPage';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-family)',
      }}>
        Initializing Mini ERP System...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage showToast={showToast} />
        <Toast toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'customers': return 'Customer CRM Management';
      case 'products': return 'Product & Inventory Control';
      case 'challans': return 'Sales Challans & Invoices';
      default: return 'Mini ERP System';
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar title={getPageTitle()} theme={theme} toggleTheme={toggleTheme} />
        <main className="page-body">
          {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} showToast={showToast} />}
          {activeTab === 'customers' && <CustomersPage showToast={showToast} />}
          {activeTab === 'products' && <ProductsPage showToast={showToast} />}
          {activeTab === 'challans' && <ChallansPage showToast={showToast} />}
        </main>
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
