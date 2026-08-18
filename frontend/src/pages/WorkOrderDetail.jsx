import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHeader, StatusBadge, ErrorBanner } from '../components/ui.jsx';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const [wo, setWo] = useState(null);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');
  const [parts, setParts] = useState([]);
  const [partId, setPartId] = useState('');
  const [qty, setQty] = useState(1);

  const load = () => {
    client.get(`/work-orders/${id}`).then((res) => setWo(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load work order'));
  };

  useEffect(load, [id]);
  useEffect(() => { client.get('/parts', { params: { pageSize: 200 } }).then((res) => setParts(res.data.data)).catch(() => {}); }, []);

  const setStatus = async (status) => { await client.put(`/work-orders/${id}`, { status }); load(); };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await client.post(`/work-orders/${id}/tasks`, { description: newTask });
    setNewTask('');
    load();
  };

  const toggleTask = async (task) => {
    await client.put(`/work-orders/${id}/tasks/${task.id}`, { isCompleted: !task.isCompleted });
    load();
  };

  const issuePart = async (e) => {
    e.preventDefault();
    if (!partId) return;
    await client.post(`/work-orders/${id}/parts`, { partId, quantity: Number(qty) });
    setPartId('');
    setQty(1);
    load();
  };

  if (error) return <ErrorBanner message={error} />;
  if (!wo) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={`${wo.woNumber} — ${wo.title}`}
        subtitle={wo.Asset ? <Link className="text-brand-600 hover:underline" to={`/assets/${wo.Asset.id}`}>{wo.Asset.name}</Link> : 'No asset linked'}
        actions={
          <select className="input" value={wo.status} onChange={(e) => setStatus(e.target.value)}>
            {['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><div className="text-xs uppercase text-slate-500 mb-1">Status</div><StatusBadge value={wo.status} /></div>
        <div className="card p-4"><div className="text-xs uppercase text-slate-500 mb-1">Priority</div><StatusBadge value={wo.priority} /></div>
        <div className="card p-4"><div className="text-xs uppercase text-slate-500 mb-1">Assigned to</div><div className="font-medium">{wo.assignedTo?.name || 'Unassigned'}</div></div>
        <div className="card p-4"><div className="text-xs uppercase text-slate-500 mb-1">Due</div><div className="font-medium">{wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '—'}</div></div>
      </div>

      {wo.description && (
        <div className="card p-4 mb-6">
          <h2 className="font-medium mb-2">Description</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{wo.description}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-medium mb-3">Checklist</h2>
          <ul className="space-y-2 mb-3">
            {(wo.tasks || []).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={t.isCompleted} onChange={() => toggleTask(t)} />
                <span className={t.isCompleted ? 'line-through text-slate-400' : ''}>{t.description}</span>
              </li>
            ))}
            {(wo.tasks || []).length === 0 && <li className="text-sm text-slate-400">No checklist items yet.</li>}
          </ul>
          <form onSubmit={addTask} className="flex gap-2">
            <input className="input" placeholder="Add checklist item..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
            <button className="btn-secondary" type="submit">Add</button>
          </form>
        </div>

        <div className="card p-4">
          <h2 className="font-medium mb-3">Parts used</h2>
          <ul className="divide-y divide-slate-100 mb-3">
            {(wo.InventoryTransactions || []).map((t) => (
              <li key={t.id} className="py-1.5 text-sm flex justify-between">
                <span>{t.Part?.name || t.partId}</span>
                <span className="text-slate-500">-{t.quantity}</span>
              </li>
            ))}
            {(wo.InventoryTransactions || []).length === 0 && <li className="text-sm text-slate-400 py-1.5">No parts issued yet.</li>}
          </ul>
          <form onSubmit={issuePart} className="flex gap-2">
            <select className="input" value={partId} onChange={(e) => setPartId(e.target.value)}>
              <option value="">Select part...</option>
              {parts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantityOnHand} on hand)</option>)}
            </select>
            <input className="input w-20" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            <button className="btn-secondary" type="submit">Issue</button>
          </form>
        </div>
      </div>
    </div>
  );
}
