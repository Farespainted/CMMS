import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', assetId: '', unit: 'hours', currentReading: 0 };

export default function Meters() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [readingModal, setReadingModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [readingForm, setReadingForm] = useState({ reading: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/meters').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load meters'));
  };
  useEffect(load, []);
  useEffect(() => { client.get('/assets', { params: { pageSize: 200 } }).then((res) => setAssets(res.data.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/meters', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create meter');
    } finally {
      setSaving(false);
    }
  };

  const submitReading = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post(`/meters/${readingModal.id}/readings`, { reading: Number(readingForm.reading), notes: readingForm.notes });
      setReadingModal(null);
      setReadingForm({ reading: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record reading');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Meters"
        subtitle="Runtime hours, mileage, and cycle counts for condition-based maintenance"
        actions={can('meters:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New meter</button>}
      />
      <ErrorBanner message={error} />
      <div className="grid md:grid-cols-3 gap-4">
        {rows.map((m) => (
          <div key={m.id} className="card p-4">
            <h3 className="font-medium">{m.name}</h3>
            <p className="text-sm text-slate-500">{m.Asset?.name || 'No asset'}</p>
            <p className="text-2xl font-semibold mt-2">{m.currentReading} <span className="text-sm font-normal text-slate-500">{m.unit}</span></p>
            {can('meters:write') && (
              <button className="btn-secondary mt-3" onClick={() => { setReadingModal(m); setReadingForm({ reading: m.currentReading, notes: '' }); }}>Record reading</button>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400">No meters yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New meter">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <label className="label">Asset</label>
            <select className="input" required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
              <option value="">Select asset...</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div><label className="label">Starting reading</label><input type="number" className="input" value={form.currentReading} onChange={(e) => setForm({ ...form, currentReading: Number(e.target.value) })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create meter'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!readingModal} onClose={() => setReadingModal(null)} title={`Record reading — ${readingModal?.name || ''}`}>
        <form onSubmit={submitReading} className="space-y-4">
          <div><label className="label">Reading</label><input type="number" className="input" required value={readingForm.reading} onChange={(e) => setReadingForm({ ...readingForm, reading: e.target.value })} /></div>
          <div><label className="label">Notes</label><input className="input" value={readingForm.notes} onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setReadingModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save reading'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
