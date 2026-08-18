import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, StatusBadge, Modal, LoadingRow, EmptyRow, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { assetId: '', category: 'unplanned', reason: '', startTime: '', endTime: '', notes: '' };

function hours(start, end) {
  if (!start || !end) return null;
  return ((new Date(end) - new Date(start)) / 3600000).toFixed(1);
}

export default function DowntimeLogs() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/downtime-logs').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load downtime logs')).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => { client.get('/assets', { params: { pageSize: 200 } }).then((res) => setAssets(res.data.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/downtime-logs', { ...form, endTime: form.endTime || null });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to log downtime');
    } finally {
      setSaving(false);
    }
  };

  const closeOut = async (row) => {
    await client.put(`/downtime-logs/${row.id}`, { endTime: new Date().toISOString() });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Downtime Logs"
        subtitle="Track unplanned and planned asset downtime — feeds MTTR / MTBF reliability reports"
        actions={can('downtime:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Log downtime</button>}
      />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Asset</th><th>Category</th><th>Reason</th><th>Start</th><th>End</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {loading && <LoadingRow colSpan={7} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={7} />}
            {!loading && rows.map((r) => (
              <tr key={r.id}>
                <td>{r.Asset?.name || '—'}</td>
                <td><StatusBadge value={r.category} /></td>
                <td>{r.reason || '—'}</td>
                <td className="text-xs">{new Date(r.startTime).toLocaleString()}</td>
                <td className="text-xs">{r.endTime ? new Date(r.endTime).toLocaleString() : <span className="text-amber-600">ongoing</span>}</td>
                <td>{r.endTime ? `${hours(r.startTime, r.endTime)} hrs` : '—'}</td>
                <td>{!r.endTime && can('downtime:write') && <button className="text-brand-600 hover:underline text-sm" onClick={() => closeOut(r)}>Close out</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log downtime">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Asset</label>
            <select className="input" required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
              <option value="">Select asset...</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="unplanned">Unplanned</option>
                <option value="planned">Planned</option>
              </select>
            </div>
            <div>
              <label className="label">Reason</label>
              <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input type="datetime-local" required className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End time (leave blank if ongoing)</label>
              <input type="datetime-local" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log downtime'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
