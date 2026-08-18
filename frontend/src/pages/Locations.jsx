import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, LoadingRow, EmptyRow, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', code: '', address: '', parentId: '' };

export default function Locations() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/locations').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load locations')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/locations', { ...form, parentId: form.parentId || null });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Locations" subtitle="Sites, buildings, and areas" actions={can('locations:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New location</button>} />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Code</th><th>Parent</th><th>Address</th></tr></thead>
          <tbody>
            {loading && <LoadingRow colSpan={4} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={4} />}
            {!loading && rows.map((l) => (
              <tr key={l.id}><td>{l.name}</td><td>{l.code || '—'}</td><td>{l.parent?.name || '—'}</td><td>{l.address || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New location">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><label className="label">Parent location</label>
              <select className="input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">— (top level)</option>
                {rows.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create location'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
