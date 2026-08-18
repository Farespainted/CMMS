import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', url: '', events: [] };

export default function Webhooks() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/webhooks').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load webhooks'));
  };
  useEffect(load, []);
  useEffect(() => { client.get('/webhooks/events').then((res) => setEvents(res.data.data)).catch(() => {}); }, []);

  const toggleEvent = (evt) => {
    const has = form.events.includes(evt);
    setForm({ ...form, events: has ? form.events.filter((e) => e !== evt) : [...form.events, evt] });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/webhooks', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create webhook');
    } finally {
      setSaving(false);
    }
  };

  const test = async (id) => {
    await client.post(`/webhooks/${id}/test`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Push real-time events (work order created/completed, asset status changed, low stock) to other systems"
        actions={can('webhooks:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New webhook</button>}
      />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>URL</th><th>Events</th><th>Last status</th><th></th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td className="text-xs break-all">{w.url}</td>
                <td className="text-xs">{w.events.join(', ')}</td>
                <td className="text-xs">{w.lastStatus || 'never triggered'}</td>
                <td>{can('webhooks:write') && <button className="text-brand-600 hover:underline text-sm" onClick={() => test(w.id)}>Send test</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No webhooks yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New webhook">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Target URL</label><input type="url" className="input" required placeholder="https://your-system.example.com/webhooks/cmms" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div>
            <label className="label">Events</label>
            <div className="space-y-1">
              {events.map((evt) => (
                <label key={evt} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.events.includes(evt)} onChange={() => toggleEvent(evt)} />
                  <span className="font-mono text-xs">{evt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create webhook'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
