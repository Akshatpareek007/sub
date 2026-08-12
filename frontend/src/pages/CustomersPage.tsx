import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Eye,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import type { Customer, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface CustomersPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ showToast }) => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [followUpCustomer, setFollowUpCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE',
    address: '',
    status: 'ACTIVE',
    followUpDate: '',
    notes: '',
  });

  const [followUpText, setFollowUpText] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const canEdit = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, typeFilter]);

  const fetchCustomers = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('customerType', typeFilter);

      const res = await api.get(`/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.success) {
        setViewCustomer(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customer details', 'error');
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().slice(0, 10) : '',
      notes: c.notes || '',
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        showToast('Customer updated successfully!', 'success');
        setEditingCustomer(null);
      } else {
        await api.post('/customers', formData);
        showToast('Customer created successfully!', 'success');
        setIsAddModalOpen(false);
      }
      fetchCustomers(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpCustomer) return;
    try {
      await api.post(`/customers/${followUpCustomer.id}/follow-ups`, {
        note: followUpText,
        nextFollowUpDate: nextFollowUpDate || null,
      });
      showToast('Follow-up note added!', 'success');
      setFollowUpText('');
      setNextFollowUpDate('');
      const targetId = followUpCustomer.id;
      setFollowUpCustomer(null);
      if (viewCustomer && viewCustomer.id === targetId) {
        fetchCustomerDetails(targetId);
      }
      fetchCustomers(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to add follow-up note', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Customer CRM Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Manage client profiles, lead conversion status, and follow-up history
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by name, business, email, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="LEAD">LEAD</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Customer Types</option>
            <option value="RETAIL">RETAIL</option>
            <option value="WHOLESALE">WHOLESALE</option>
            <option value="DISTRIBUTOR">DISTRIBUTOR</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="table-container card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customers found matching criteria.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer / Business</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building size={12} /> {c.businessName} {c.gstNumber && `• GST: ${c.gstNumber}`}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={14} color="var(--primary)" /> {c.mobile}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={12} /> {c.email}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {c.customerType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None set</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => fetchCustomerDetails(c.id)}
                        title="View Details & Notes History"
                      >
                        <Eye size={15} />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Customer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setFollowUpCustomer(c)}
                            title="Add Follow-up Note"
                          >
                            <MessageSquare size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        <div className="pagination" style={{ padding: '1rem' }}>
          <div>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchCustomers(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchCustomers(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isAddModalOpen || !!editingCustomer}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Create New Customer'}
      >
        <form onSubmit={handleSaveCustomer}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Type *</label>
              <select
                className="form-select"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
              >
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="RETAIL">RETAIL</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">CRM Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing & Shipping Address *</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">General Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingCustomer(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW CUSTOMER DETAILS MODAL */}
      <Modal
        isOpen={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        title={`Customer File: ${viewCustomer?.name}`}
        maxWidth="750px"
      >
        {viewCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ margin: 0 }}>{viewCustomer.name}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{viewCustomer.businessName}</div>
                {viewCustomer.gstNumber && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    GSTIN: {viewCustomer.gstNumber}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge badge-${viewCustomer.status.toLowerCase()}`}>{viewCustomer.status}</span>
                <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                  {viewCustomer.customerType}
                </span>
              </div>
            </div>

            <div className="form-grid" style={{ fontSize: '0.875rem' }}>
              <div>
                <strong>Contact Info:</strong>
                <div>Phone: {viewCustomer.mobile}</div>
                <div>Email: {viewCustomer.email}</div>
              </div>
              <div>
                <strong>Address:</strong>
                <div>{viewCustomer.address}</div>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} color="var(--primary)" />
                  Follow-up Notes & Interactions Log
                </h4>
                {canEdit && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setFollowUpCustomer(viewCustomer);
                    }}
                  >
                    + Add Note
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {(!viewCustomer.followUpNotes || viewCustomer.followUpNotes.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No follow-up notes recorded yet.</div>
                ) : (
                  viewCustomer.followUpNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '0.875rem',
                        background: 'var(--bg-card-hover)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--primary)',
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                        "{note.note}"
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Logged by: {note.createdByUser?.name || 'Sales Rep'}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD FOLLOW-UP NOTE MODAL */}
      <Modal
        isOpen={!!followUpCustomer}
        onClose={() => setFollowUpCustomer(null)}
        title={`Add CRM Follow-up Note: ${followUpCustomer?.name}`}
      >
        <form onSubmit={handleAddFollowUp}>
          <div className="form-group">
            <label className="form-label">Interaction Detail / Discussion Note *</label>
            <textarea
              className="form-textarea"
              rows={3}
              required
              placeholder="e.g. Spoke with procurement head regarding pending order approval..."
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Scheduled Follow-up Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setFollowUpCustomer(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
