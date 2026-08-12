import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  History,
  MapPin,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import type { Product, StockLog, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface ProductsPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ showToast }) => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [logsPagination, setLogsPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });

  const [stockData, setStockData] = useState({
    quantityChanged: 1,
    type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const canEdit = hasRole(['ADMIN', 'WAREHOUSE']);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchProducts(1);
    } else {
      fetchStockLogs(1);
    }
  }, [activeTab, search, categoryFilter, lowStockFilter]);

  const fetchProducts = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockFilter) params.append('lowStock', 'true');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLogs = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/products/stock-logs?page=${pageNum}&limit=15`);
      if (res.success) {
        setStockLogs(res.data);
        setLogsPagination(res.pagination);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch stock logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electricals & Lighting',
      unitPrice: 100,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse A - Bin 01',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        showToast('Product updated successfully!', 'success');
        setEditingProduct(null);
      } else {
        await api.post('/products', formData);
        showToast('Product created successfully!', 'success');
        setIsAddModalOpen(false);
      }
      fetchProducts(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct) return;
    try {
      await api.post(`/products/${adjustingStockProduct.id}/stock`, stockData);
      showToast(`Stock updated (${stockData.type} ${stockData.quantityChanged})`, 'success');
      setAdjustingStockProduct(null);
      setStockData({ quantityChanged: 1, type: 'IN', reason: '' });
      fetchProducts(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Product & Inventory Control</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Real-time stock monitoring, location tracking, and movement audit log
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
            <button
              className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('catalog')}
            >
              <Package size={15} /> Catalog & Stock
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('logs')}
              style={{ marginLeft: '0.25rem' }}
            >
              <History size={15} /> Movement Logs
            </button>
          </div>

          {canEdit && activeTab === 'catalog' && (
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Catalog Filters */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Search SKU, name, category, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: '200px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Electricals & Lighting">Electricals & Lighting</option>
                <option value="Hardware & Smart Devices">Hardware & Smart Devices</option>
                <option value="Tools & Measuring">Tools & Measuring</option>
              </select>

              <button
                className={`btn btn-sm ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setLowStockFilter(!lowStockFilter)}
                style={{ height: '38px', gap: '0.5rem' }}
              >
                <AlertTriangle size={16} />
                <span>Low Stock Alert Filter</span>
              </button>
            </div>
          </div>

          {/* Product Data Table */}
          <div className="table-container card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading product inventory...
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No products found matching criteria.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Min Alert Limit</th>
                    <th>Warehouse Bin</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLowStock = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id} style={{ background: isLowStock ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                            SKU: {p.sku}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Tag size={12} /> {p.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: isLowStock ? 'var(--danger)' : 'var(--success)',
                            }}>
                              {p.currentStock}
                            </span>
                            {isLowStock && (
                              <span className="badge badge-inactive" style={{ fontSize: '0.65rem' }}>
                                LOW STOCK
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {p.minStockAlert} units
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={12} /> {p.location}
                          </span>
                        </td>
                        {canEdit && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Product"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setAdjustingStockProduct(p);
                                  setStockData({ quantityChanged: 5, type: 'IN', reason: 'Warehouse Stock Adjustment' });
                                }}
                                title="Stock In/Out Entry"
                              >
                                Adjust Stock
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div className="pagination" style={{ padding: '1rem' }}>
              <div>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProducts(pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProducts(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* STOCK MOVEMENT AUDIT LOGS TABLE */
        <div className="table-container card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading stock audit log...
            </div>
          ) : stockLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No stock log entries recorded.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Log Date & Time</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Qty Changed</th>
                  <th>Reason / Context</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{log.product?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>SKU: {log.product?.sku}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${log.type.toLowerCase()}`}>
                        {log.type === 'IN' ? 'STOCK IN' : 'STOCK OUT'}
                      </span>
                    </td>
                    <td>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: log.type === 'IN' ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {log.type === 'IN' ? '+' : '-'}{log.quantityChanged}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{log.reason}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.createdByUser?.name || 'System'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.createdByUser?.role}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination for Stock Logs */}
          <div className="pagination" style={{ padding: '1rem' }}>
            <div>
              Showing page {logsPagination.page} of {logsPagination.totalPages} ({logsPagination.total} log entries)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={logsPagination.page <= 1}
                onClick={() => fetchStockLogs(logsPagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={logsPagination.page >= logsPagination.totalPages}
                onClick={() => fetchStockLogs(logsPagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen || !!editingProduct}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New Inventory Product'}
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-grid">
            {!editingProduct && (
              <div className="form-group">
                <label className="form-label">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Minimum Stock Alert Threshold *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Bin / Location *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Warehouse A - Rack 04"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADJUST STOCK MODAL */}
      <Modal
        isOpen={!!adjustingStockProduct}
        onClose={() => setAdjustingStockProduct(null)}
        title={`Adjust Stock Level: ${adjustingStockProduct?.name} (${adjustingStockProduct?.sku})`}
      >
        {adjustingStockProduct && (
          <form onSubmit={handleAdjustStock}>
            <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div>Current Available Stock: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{adjustingStockProduct.currentStock} units</strong></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location: {adjustingStockProduct.location}</div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Movement Type *</label>
                <select
                  className="form-select"
                  value={stockData.type}
                  onChange={(e) => setStockData({ ...stockData, type: e.target.value as 'IN' | 'OUT' })}
                >
                  <option value="IN">STOCK IN (Addition / Restock)</option>
                  <option value="OUT">STOCK OUT (Dispatch / Adjustment)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Changed *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  required
                  value={stockData.quantityChanged}
                  onChange={(e) => setStockData({ ...stockData, quantityChanged: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason / Reference Note *</label>
              <textarea
                className="form-textarea"
                rows={2}
                required
                placeholder="e.g. Received PO-901 shipment or Damaged goods write-off..."
                value={stockData.reason}
                onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setAdjustingStockProduct(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Record Stock Adjustment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
