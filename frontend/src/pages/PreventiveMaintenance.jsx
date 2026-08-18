import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', description: '', assetId: '', frequencyType: 'months', frequencyValue: 1, leadTimeDays: 3, nextDueDate: '', assignedToId: '', priority: 'medium' };

export default function PreventiveMaintenance() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/preventive-maintenance').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load PM schedules'));
  };

  useEffect(load, []);
  useEffect(() => {
    client.get('/assets', { params: { pageSize: 200 } }).then((res) => setAssets(res.data.data)).catch(() => {});
    client.get('/users').then((res) => setUsers(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/preventive-maintenance', { ...form, assignedToId: form.assignedToId || null });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const generateNow = async (id) => {
    await client.post(`/preventive-maintenance/${id}/generate`);
    load();
  };

  const isDueSoon = (date) => new Date(date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div>
      <PageHeader
        title="Preventive Maintenance"
        subtitle="Recurring schedules that automatically generate work orders"
        actions={can('preventive_maintenance:write') && <button className="btn-primary" onClick={openCreate}>+ New schedule</button>}
      />
      <ErrorBanner message={error} />

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((pm) => (
          <div key={pm.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{pm.name}</h3>
                <p className="text-sm text-slate-500">{pm.Asset?.name || 'No asset'}</p>
              </div>
              <span className={`badge ${isDueSoon(pm.nextDueDate) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                Due {new Date(pm.nextDueDate).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Every {pm.frequencyValue} {pm.frequencyType}</p>
            {pm.assignedTo && <p className="text-sm text-slate-500">Assigned to {pm.assignedTo.name}</p>}
            {can('preventive_maintenance:write') && (
              <button className="btn-secondary mt-3" onClick={() => generateNow(pm.id)}>Generate work order now</button>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400">No PM schedules yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New PM schedule">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Asset</label>
            <select className="input" required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
              <option value="">Select asset...</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Every</label>
              <input type="number" min="1" className="input" value={form.frequencyValue} onChange={(e) => setForm({ ...form, frequencyValue: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.frequencyType} onChange={(e) => setForm({ ...form, frequencyType: e.target.value })}>
                {['days', 'weeks', 'months'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lead time (days)</label>
              <input type="number" min="0" className="input" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First due date</label>
              <input type="date" required className="input" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create schedule'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
