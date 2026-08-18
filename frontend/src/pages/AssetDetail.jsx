import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHeader, StatusBadge, ErrorBanner } from '../components/ui.jsx';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [pmSchedules, setPmSchedules] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    client.get(`/assets/${id}`).then((res) => setAsset(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load asset'));
    client.get('/work-orders', { params: { assetId: id, pageSize: 10 } }).then((res) => setWorkOrders(res.data.data)).catch(() => {});
    client.get(`/assets/${id}/pm-schedules`).then((res) => setPmSchedules(res.data.data)).catch(() => {});
  };

  useEffect(load, [id]);

  const updateStatus = async (status) => {
    await client.put(`/assets/${id}`, { status });
    load();
  };

  if (error) return <ErrorBanner message={error} />;
  if (!asset) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={asset.name}
        subtitle={`Tag: ${asset.assetTag}${asset.serialNumber ? ` • Serial: ${asset.serialNumber}` : ''}`}
        actions={
          <select className="input" value={asset.status} onChange={(e) => updateStatus(e.target.value)}>
            {['operational', 'down', 'maintenance', 'retired'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 mb-1">Status</div>
          <StatusBadge value={asset.status} />
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 mb-1">Criticality</div>
          <StatusBadge value={asset.criticality} />
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 mb-1">Location</div>
          <div className="font-medium">{asset.Location?.name || '—'}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-medium mb-3">Recent work orders</h2>
          {workOrders.length === 0 && <p className="text-sm text-slate-400">No work orders yet.</p>}
          <ul className="divide-y divide-slate-100">
            {workOrders.map((wo) => (
              <li key={wo.id} className="py-2 flex items-center justify-between text-sm">
                <Link to={`/work-orders/${wo.id}`} className="text-brand-600 hover:underline">{wo.woNumber} — {wo.title}</Link>
                <StatusBadge value={wo.status} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="font-medium mb-3">Preventive maintenance schedules</h2>
          {pmSchedules.length === 0 && <p className="text-sm text-slate-400">No PM schedules yet.</p>}
          <ul className="divide-y divide-slate-100">
            {pmSchedules.map((pm) => (
              <li key={pm.id} className="py-2 text-sm flex items-center justify-between">
                <span>{pm.name}</span>
                <span className="text-slate-500">Due {new Date(pm.nextDueDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
