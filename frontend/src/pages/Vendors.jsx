import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, LoadingRow, EmptyRow, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', contactName: '', email: '', phone: '', category: 'supplier' };

export default function Vendors() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/vendors').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load vendors')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/vendors', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Suppliers and contractors" actions={can('vendors:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New vendor</button>} />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Category</th></tr></thead>
          <tbody>
            {loading && <LoadingRow colSpan={5} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={5} />}
            {!loading && rows.map((v) => (
              <tr key={v.id}><td>{v.name}</td><td>{v.contactName || '—'}</td><td>{v.email || '—'}</td><td>{v.phone || '—'}</td><td className="capitalize">{v.category}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New vendor">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Contact name</label><input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['supplier', 'contractor', 'both'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create vendor'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
