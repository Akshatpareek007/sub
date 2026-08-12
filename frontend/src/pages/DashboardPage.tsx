import React, { useEffect, useState } from 'react';
import {
  Users,
  Package,
  FileText,
  AlertTriangle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ setActiveTab, showToast }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading ERP operational summary...
      </div>
    );
  }

  const { summary, recentStockLogs, recentChallans } = data || {
    summary: {},
    recentStockLogs: [],
    recentChallans: [],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid var(--primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome back, {user?.name}! 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            System overview for your role <span style={{ fontWeight: 700, color: 'var(--primary)' }}>({user?.role})</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('challans')}>
              + New Challan
            </button>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('products')}>
              Manage Stock
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Alert Banner */}
      {summary.lowStockCount > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fbbf24',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Stock Warning: {summary.lowStockCount} item(s) below minimum alert quantity!
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Immediate reordering recommended to prevent sales fulfillment blockages.
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('products')}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
          >
            View Low Stock Items
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1 */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Confirmed Revenue
            </span>
            <div style={{ padding: '0.5rem', background: 'var(--success-bg)', borderRadius: '8px', color: 'var(--success)' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--text-main)' }}>
            ₹{summary.confirmedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            From confirmed sales challans
          </div>
        </div>

        {/* Card 2 */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Customers
            </span>
            <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--text-main)' }}>
            {summary.activeCustomers} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {summary.totalCustomers}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total accounts in CRM
          </div>
        </div>

        {/* Card 3 */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Inventory Valuation
            </span>
            <div style={{ padding: '0.5rem', background: 'var(--info-bg)', borderRadius: '8px', color: 'var(--info)' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--text-main)' }}>
            ₹{summary.totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary.totalProducts} total product catalog SKUs
          </div>
        </div>

        {/* Card 4 */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Challans
            </span>
            <div style={{ padding: '0.5rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '8px', color: '#c084fc' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--text-main)' }}>
            {summary.totalChallans}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary.confirmedItemsSold} items fulfilled
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Stock Logs & Recent Challans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Stock Movement */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Stock Movements</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('products')}>
              View Logs
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentStockLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No stock movements logged.</div>
            ) : (
              recentStockLogs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-hover)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.35rem',
                      borderRadius: '50%',
                      background: log.type === 'IN' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: log.type === 'IN' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {log.type === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {log.product?.name || 'Product'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.reason} • By {log.createdByUser?.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${log.type.toLowerCase()}`}>
                      {log.type === 'IN' ? '+' : '-'}{log.quantityChanged}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Challans */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Sales Challans</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('challans')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentChallans.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No sales challans recorded.</div>
            ) : (
              recentChallans.map((ch: any) => (
                <div
                  key={ch.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-hover)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                      #{ch.challanNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ch.customer?.businessName || ch.customer?.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${ch.status.toLowerCase()}`}>
                      {ch.status}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      ₹{ch.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
