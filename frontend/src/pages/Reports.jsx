import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, ErrorBanner } from '../components/ui.jsx';

export default function Reports() {
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { client.get('/assets', { params: { pageSize: 200 } }).then((res) => setAssets(res.data.data)).catch(() => {}); }, []);

  const lookup = async (id) => {
    setAssetId(id);
    setStats(null);
    if (!id) return;
    try {
      const res = await client.get(`/reports/assets/${id}/reliability`);
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load reliability stats');
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Asset reliability (MTTR / MTBF) based on logged downtime" />
      <ErrorBanner message={error} />
      <div className="card p-4 max-w-md">
        <label className="label">Select an asset</label>
        <select className="input" value={assetId} onChange={(e) => lookup(e.target.value)}>
          <option value="">Choose asset...</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {stats && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Downtime incidents</span><span className="font-medium">{stats.incidents}</span></div>
            <div className="flex justify-between"><span>Mean time to repair (MTTR)</span><span className="font-medium">{stats.mttrHours ? `${stats.mttrHours.toFixed(1)} hrs` : '—'}</span></div>
            <div className="flex justify-between"><span>Mean time between failures (MTBF)</span><span className="font-medium">{stats.mtbfHours ? `${stats.mtbfHours.toFixed(1)} hrs` : '—'}</span></div>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mt-6">
        For overall KPIs (open work orders, low stock, overdue PM, etc.) see the <a className="text-brand-600 hover:underline" href="/">Dashboard</a>.
      </p>
    </div>
  );
}
