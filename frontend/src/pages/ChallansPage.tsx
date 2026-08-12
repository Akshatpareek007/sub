import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import type { Challan, Customer, Product, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface ChallansPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChallansPage: React.FC<ChallansPageProps> = ({ showToast }) => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // Data for Form
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [initialStatus, setInitialStatus] = useState<'DRAFT' | 'CONFIRMED'>('CONFIRMED');

  const canCreate = hasRole(['ADMIN', 'SALES', 'ACCOUNTS']);

  useEffect(() => {
    fetchChallans(1);
  }, [search, statusFilter]);

  const fetchChallans = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/challans?${params.toString()}`);
      if (res.success) {
        setChallans(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch sales challans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMasterData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      if (custRes.success) setAllCustomers(custRes.data);
      if (prodRes.success) setAllProducts(prodRes.data);
    } catch (err: any) {
      showToast('Failed to load master customer/product data', 'error');
    }
  };

  const handleOpenCreateModal = () => {
    fetchFormMasterData();
    setSelectedCustomerId('');
    setItems([{ productId: '', quantity: 1 }]);
    setInitialStatus('CONFIRMED');
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      showToast('At least one product item with quantity > 0 is required', 'error');
      return;
    }

    try {
      const res = await api.post('/challans', {
        customerId: selectedCustomerId,
        status: initialStatus,
        items: validItems,
      });

      if (res.success) {
        showToast(res.message, 'success');
        setIsCreateModalOpen(false);
        fetchChallans(1);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create sales challan', 'error');
    }
  };

  const handleFetchChallanDetail = async (id: string) => {
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.success) {
        setSelectedChallan(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch challan details', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, targetStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await api.patch(`/challans/${id}/status`, { status: targetStatus });
      if (res.success) {
        showToast(res.message, 'success');
        setSelectedChallan(null);
        fetchChallans(pagination.page);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Calculate live totals for order builder form
  const calculateFormTotal = () => {
    let totalQty = 0;
    let totalVal = 0;
    items.forEach((it) => {
      const prod = allProducts.find((p) => p.id === it.productId);
      if (prod && it.quantity > 0) {
        totalQty += it.quantity;
        totalVal += prod.unitPrice * it.quantity;
      }
    });
    return { totalQty, totalVal };
  };

  const { totalQty, totalVal } = calculateFormTotal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Sales Challans & Invoices</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Generate automatic sales delivery challans, enforce stock limits, & export PDF invoices
          </p>
        </div>

        {canCreate && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Create Sales Challan</span>
          </button>
        )}
      </div>

      {/* Search & Status Filters */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search challan number, customer name, business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-container card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading sales challans...
          </div>
        ) : challans.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No sales challans recorded.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer / Business</th>
                <th>Status</th>
                <th>Total Items</th>
                <th>Grand Total (₹)</th>
                <th>Issued Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      #{ch.challanNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {ch.customerSnapshot?.name || ch.customer?.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building size={12} /> {ch.customerSnapshot?.businessName || ch.customer?.businessName}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${ch.status.toLowerCase()}`}>
                      {ch.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ch.totalQuantity} units</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{ch.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      By {ch.createdByUser?.name || 'Sales Rep'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleFetchChallanDetail(ch.id)}
                        title="View Challan Details & Item Snapshots"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Download PDF button */}
                      <a
                        href={api.getPDFUrl(ch.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--primary)' }}
                        title="Export Invoice as PDF"
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="pagination" style={{ padding: '1rem' }}>
          <div>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} challans)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchChallans(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchChallans(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE CHALLAN BUILDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sales Delivery Challan"
        maxWidth="800px"
      >
        <form onSubmit={handleCreateChallan}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Select Customer Account *</label>
              <select
                className="form-select"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- Choose Customer --</option>
                {allCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessName}) - {c.customerType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Challan Status *</label>
              <select
                className="form-select"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as any)}
              >
                <option value="CONFIRMED">CONFIRMED (Deduct stock immediately)</option>
                <option value="DRAFT">DRAFT (Save proposal without stock deduction)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Item Rows */}
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Add Products to Challan *</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItemRow}
              >
                <Plus size={14} /> Add Another Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, index) => {
                const prod = allProducts.find((p) => p.id === item.productId);
                const isStockInsufficient = prod ? prod.currentStock < item.quantity : false;

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: 'var(--bg-card-hover)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {/* Product Selector */}
                    <div style={{ flex: 2 }}>
                      <select
                        className="form-select"
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {allProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - Available Stock: {p.currentStock} | ₹{p.unitPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Input */}
                    <div style={{ width: '110px' }}>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    {/* Unit & Item Total */}
                    <div style={{ width: '130px', fontSize: '0.85rem', textAlign: 'right' }}>
                      {prod ? (
                        <>
                          <div style={{ fontWeight: 700 }}>₹{(prod.unitPrice * item.quantity).toFixed(2)}</div>
                          <div style={{ fontSize: '0.72rem', color: isStockInsufficient ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {isStockInsufficient ? '⚠️ EXCEEDS STOCK' : `₹${prod.unitPrice}/unit`}
                          </div>
                        </>
                      ) : (
                        '-'
                      )}
                    </div>

                    {/* Remove Row Button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Order Summary Footer */}
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Total Quantity</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{totalQty} units</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Sales Challan
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW CHALLAN DETAIL MODAL */}
      <Modal
        isOpen={!!selectedChallan}
        onClose={() => setSelectedChallan(null)}
        title={`Sales Challan Details #${selectedChallan?.challanNumber}`}
        maxWidth="750px"
      >
        {selectedChallan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer Snapshot</div>
                <h3 style={{ margin: 0 }}>{selectedChallan.customerSnapshot?.name}</h3>
                <div style={{ fontSize: '0.85rem' }}>{selectedChallan.customerSnapshot?.businessName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedChallan.customerSnapshot?.address}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${selectedChallan.status.toLowerCase()}`}>
                  {selectedChallan.status}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Issued on: {new Date(selectedChallan.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  By: {selectedChallan.createdByUser?.name}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>Itemized Product Breakdown (Preserved Snapshots)</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Description / SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.productSnapshot?.name || item.product?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                            SKU: {item.productSnapshot?.sku || item.product?.sku}
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.unitPrice.toFixed(2)}</td>
                        <td>₹{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <strong>Total Items Sold:</strong> {selectedChallan.totalQuantity} units
              </div>
              <div>
                <strong>Grand Total:</strong>{' '}
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{selectedChallan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <a
                href={api.getPDFUrl(selectedChallan.id)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <Download size={18} /> Export Printable PDF Invoice
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedChallan.status === 'DRAFT' && canCreate && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleUpdateStatus(selectedChallan.id, 'CONFIRMED')}
                  >
                    <CheckCircle size={16} /> Confirm & Deduct Stock
                  </button>
                )}

                {selectedChallan.status !== 'CANCELLED' && canCreate && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleUpdateStatus(selectedChallan.id, 'CANCELLED')}
                  >
                    <XCircle size={16} /> Cancel Challan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
