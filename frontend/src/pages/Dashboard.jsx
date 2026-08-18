import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHeader, Kpi, ErrorBanner } from '../components/ui.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/reports/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load dashboard'));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of maintenance activity" />
      <ErrorBanner message={error} />
      {!data ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Kpi label="Open Work Orders" value={data.openWorkOrders} />
            <Kpi label="Overdue Work Orders" value={data.overdueWorkOrders} tone={data.overdueWorkOrders > 0 ? 'danger' : 'default'} />
            <Kpi label="Completed This Month" value={data.completedThisMonth} tone="success" />
            <Kpi label="Assets Down" value={data.downAssets} tone={data.downAssets > 0 ? 'danger' : 'default'} />
            <Kpi label="Total Assets" value={data.totalAssets} />
            <Kpi label="Low Stock Parts" value={data.lowStockParts} tone={data.lowStockParts > 0 ? 'warning' : 'default'} />
            <Kpi label="PM Due (7 days)" value={data.upcomingPm} tone={data.upcomingPm > 0 ? 'warning' : 'default'} />
            <Kpi label="Total Work Orders" value={data.totalWorkOrders} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-4">
              <h2 className="font-medium mb-3">Open work orders by priority</h2>
              <ul className="space-y-2 text-sm">
                {data.openWorkOrdersByPriority.length === 0 && <li className="text-slate-400">None open</li>}
                {data.openWorkOrdersByPriority.map((row) => (
                  <li key={row.priority} className="flex justify-between">
                    <span className="capitalize">{row.priority}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <h2 className="font-medium mb-3">Work orders by status</h2>
              <ul className="space-y-2 text-sm">
                {data.workOrdersByStatus.map((row) => (
                  <li key={row.status} className="flex justify-between">
                    <span className="capitalize">{String(row.status).replace(/_/g, ' ')}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to="/work-orders" className="btn-primary">View work orders</Link>
            <Link to="/assets" className="btn-secondary">View assets</Link>
          </div>
        </>
      )}
    </div>
  );
}
