import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, StatusBadge, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyItem = { description: '', partId: '', quantity: 1, unitCost: 0 };
const emptyForm = { vendorId: '', notes: '', expectedDate: '', items: [{ ...emptyItem }] };

export default function PurchaseOrders() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [parts, setParts] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/purchase-orders').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load purchase orders'));
  };
  useEffect(load, []);
  useEffect(() => {
    client.get('/vendors').then((res) => setVendors(res.data.data)).catch(() => {});
    client.get('/parts', { params: { pageSize: 200 } }).then((res) => setParts(res.data.data)).catch(() => {});
  }, []);

  const updateItem = (idx, patch) => {
    const items = form.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/purchase-orders', { ...form, vendorId: form.vendorId || null, items: form.items.filter((it) => it.description) });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const receive = async (id) => {
    await client.post(`/purchase-orders/${id}/receive`);
    load();
  };

  const total = form.items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unitCost || 0), 0);

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Ordering parts and services from vendors" actions={can('purchase_orders:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New PO</button>} />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Total</th><th>Expected</th><th></th></tr></thead>
          <tbody>
            {rows.map((po) => (
              <tr key={po.id}>
                <td className="font-mono text-xs">{po.poNumber}</td>
                <td>{po.Vendor?.name || '—'}</td>
                <td><StatusBadge value={po.status} /></td>
                <td>${Number(po.totalAmount).toFixed(2)}</td>
                <td>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}</td>
                <td>
                  {po.status !== 'received' && can('purchase_orders:write') && (
                    <button className="text-brand-600 hover:underline text-sm" onClick={() => receive(po.id)}>Mark received</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New purchase order" width="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vendor</label>
              <select className="input" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                <option value="">Select vendor...</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expected date</label>
              <input type="date" className="input" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Line items</label>
            <div className="space-y-2">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-4" value={it.partId} onChange={(e) => {
                    const part = parts.find((p) => p.id === e.target.value);
                    updateItem(idx, { partId: e.target.value, description: part ? part.name : it.description, unitCost: part ? part.unitCost : it.unitCost });
                  }}>
                    <option value="">Custom item...</option>
                    {parts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input col-span-3" placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  <input type="number" className="input col-span-2" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  <input type="number" step="0.01" className="input col-span-2" placeholder="Unit cost" value={it.unitCost} onChange={(e) => updateItem(idx, { unitCost: Number(e.target.value) })} />
                  <button type="button" className="col-span-1 text-slate-400 hover:text-red-500" onClick={() => removeItem(idx)}>&times;</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary mt-2" onClick={addItem}>+ Add line item</button>
          </div>

          <div className="text-right text-sm font-medium">Total: ${total.toFixed(2)}</div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create purchase order'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
