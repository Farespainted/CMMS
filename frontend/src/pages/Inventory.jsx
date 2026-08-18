import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, LoadingRow, EmptyRow, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', partNumber: '', category: '', unitOfMeasure: 'each', quantityOnHand: 0, reorderPoint: 0, reorderQuantity: 0, unitCost: 0 };

export default function Inventory() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txnModal, setTxnModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [txnForm, setTxnForm] = useState({ type: 'receive', quantity: 1, notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/parts', { params: { lowStock: lowStockOnly || undefined, pageSize: 100 } })
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load parts'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lowStockOnly]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/parts', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create part');
    } finally {
      setSaving(false);
    }
  };

  const submitTxn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post(`/parts/${txnModal.id}/transactions`, txnForm);
      setTxnModal(null);
      setTxnForm({ type: 'receive', quantity: 1, notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory & Parts"
        subtitle="Spare parts stock levels"
        actions={can('parts:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New part</button>}
      />
      <ErrorBanner message={error} />

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
        Show low stock only
      </label>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Part #</th><th>On hand</th><th>Reorder pt.</th><th>Unit cost</th><th></th></tr>
          </thead>
          <tbody>
            {loading && <LoadingRow colSpan={6} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={6} />}
            {!loading && rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="font-mono text-xs">{p.partNumber}</td>
                <td className={Number(p.quantityOnHand) <= Number(p.reorderPoint) ? 'text-red-600 font-medium' : ''}>{p.quantityOnHand} {p.unitOfMeasure}</td>
                <td>{p.reorderPoint}</td>
                <td>${Number(p.unitCost).toFixed(2)}</td>
                <td>
                  {can('inventory:write') && (
                    <button className="text-brand-600 hover:underline text-sm" onClick={() => setTxnModal(p)}>Adjust stock</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New part">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Part number</label><input className="input" required value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Qty on hand</label><input type="number" className="input" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: Number(e.target.value) })} /></div>
            <div><label className="label">Reorder point</label><input type="number" className="input" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: Number(e.target.value) })} /></div>
            <div><label className="label">Reorder qty</label><input type="number" className="input" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: Number(e.target.value) })} /></div>
          </div>
          <div><label className="label">Unit cost</label><input type="number" step="0.01" className="input" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create part'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!txnModal} onClose={() => setTxnModal(null)} title={`Adjust stock — ${txnModal?.name || ''}`}>
        <form onSubmit={submitTxn} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select className="input" value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}>
              <option value="receive">Receive (add stock)</option>
              <option value="return">Return (add stock)</option>
              <option value="adjust">Adjust (set absolute quantity)</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" className="input" value={txnForm.quantity} onChange={(e) => setTxnForm({ ...txnForm, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={txnForm.notes} onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setTxnModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
