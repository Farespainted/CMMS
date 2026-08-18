import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHeader, StatusBadge, Modal, LoadingRow, EmptyRow, ErrorBanner, Pagination } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { title: '', description: '', type: 'corrective', priority: 'medium', assetId: '', assignedToId: '', dueDate: '' };

export default function WorkOrders() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/work-orders', { params: { page, status: filters.status || undefined, priority: filters.priority || undefined } })
      .then((res) => { setRows(res.data.data); setMeta(res.data.meta); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load work orders'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, filters]);
  useEffect(() => {
    client.get('/assets', { params: { pageSize: 200 } }).then((res) => setAssets(res.data.data)).catch(() => {});
    client.get('/users').then((res) => setUsers(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, assetId: form.assetId || null, assignedToId: form.assignedToId || null, dueDate: form.dueDate || null };
      await client.post('/work-orders', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create work order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle="Reactive, preventive, and inspection work"
        actions={can('work_orders:write') && <button className="btn-primary" onClick={openCreate}>+ New work order</button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-4 flex gap-2">
        <select className="input max-w-[160px]" value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }); }}>
          <option value="">All statuses</option>
          {['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filters.priority} onChange={(e) => { setPage(1); setFilters({ ...filters, priority: e.target.value }); }}>
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>WO #</th><th>Title</th><th>Asset</th><th>Assigned to</th><th>Priority</th><th>Status</th><th>Due</th>
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow colSpan={7} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={7} />}
            {!loading && rows.map((wo) => (
              <tr key={wo.id}>
                <td className="font-mono text-xs"><Link className="text-brand-600 hover:underline" to={`/work-orders/${wo.id}`}>{wo.woNumber}</Link></td>
                <td>{wo.title}</td>
                <td>{wo.Asset?.name || '—'}</td>
                <td>{wo.assignedTo?.name || 'Unassigned'}</td>
                <td><StatusBadge value={wo.priority} /></td>
                <td><StatusBadge value={wo.status} /></td>
                <td className={wo.dueDate && new Date(wo.dueDate) < new Date() && !['completed', 'cancelled'].includes(wo.status) ? 'text-red-600 font-medium' : ''}>
                  {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={meta.page || 1} totalPages={meta.totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New work order">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['corrective', 'preventive', 'inspection', 'emergency', 'project'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Asset</label>
              <select className="input" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
                <option value="">—</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create work order'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
