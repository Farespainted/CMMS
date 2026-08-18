import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHeader, StatusBadge, Modal, LoadingRow, EmptyRow, ErrorBanner, Pagination } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', assetTag: '', category: '', manufacturer: '', status: 'operational', criticality: 'medium', locationId: '' };

export default function Assets() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/assets', { params: { search: search || undefined, page } })
      .then((res) => { setRows(res.data.data); setMeta(res.data.meta); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load assets'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);
  useEffect(() => { client.get('/locations').then((res) => setLocations(res.data.data)).catch(() => {}); }, []);

  const onSearchSubmit = (e) => { e.preventDefault(); setPage(1); load(); };

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/assets', { ...form, locationId: form.locationId || null });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle="Equipment and machinery under management"
        actions={can('assets:write') && <button className="btn-primary" onClick={openCreate}>+ New asset</button>}
      />
      <ErrorBanner message={error} />

      <form onSubmit={onSearchSubmit} className="mb-4 flex gap-2">
        <input className="input max-w-xs" placeholder="Search by name, tag, or serial..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary" type="submit">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Tag</th><th>Category</th><th>Location</th><th>Status</th><th>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow colSpan={6} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={6} />}
            {!loading && rows.map((a) => (
              <tr key={a.id}>
                <td><Link className="text-brand-600 hover:underline font-medium" to={`/assets/${a.id}`}>{a.name}</Link></td>
                <td className="font-mono text-xs">{a.assetTag}</td>
                <td>{a.category || '—'}</td>
                <td>{a.Location?.name || '—'}</td>
                <td><StatusBadge value={a.status} /></td>
                <td><StatusBadge value={a.criticality} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={meta.page || 1} totalPages={meta.totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New asset">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Asset tag (optional, auto-generated)</label>
              <input className="input" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Manufacturer</label>
              <input className="input" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <select className="input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
                <option value="">—</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['operational', 'down', 'maintenance', 'retired'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Criticality</label>
              <select className="input" value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create asset'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
