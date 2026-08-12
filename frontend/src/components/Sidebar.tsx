import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] },
    { id: 'products', label: 'Product & Stock', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'challans', label: 'Sales Challans', icon: FileText, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' };
      case 'SALES': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' };
      case 'WAREHOUSE': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' };
      case 'ACCOUNTS': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399' };
      default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' };
    }
  };

  const roleStyle = user ? getRoleBadgeStyle(user.role) : { bg: '#334155', color: '#fff' };

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
        }}>
          <Building2 size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>ERP Operations</h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Wholesale & CRM Portal</span>
        </div>
      </div>

      {/* User Role Card */}
      {user && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Logged in as:</div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
            <span style={{
              background: roleStyle.bg,
              color: roleStyle.color,
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}>
              {user.role} ROLE
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = user ? item.roles.includes(user.role) : false;

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System info */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        Mini ERP v1.0 • Node & React
      </div>
    </aside>
  );
};
