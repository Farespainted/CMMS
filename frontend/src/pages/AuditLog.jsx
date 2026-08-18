import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, LoadingRow, EmptyRow, ErrorBanner, Pagination } from '../components/ui.jsx';

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    setLoading(true);
    client.get('/audit-logs', { params: { page } })
      .then((res) => { setRows(res.data.data); setMeta(res.data.meta); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Who changed what, and when — includes actions taken via the API" />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {loading && <LoadingRow colSpan={4} />}
            {!loading && rows.length === 0 && <EmptyRow colSpan={4} />}
            {!loading && rows.map((r) => (
              <tr key={r.id}>
                <td className="text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="text-xs">{r.actorLabel} <span className="text-slate-400">({r.actorType})</span></td>
                <td className="text-xs">{r.action}</td>
                <td className="text-xs">{r.entityType} {r.entityId ? `#${String(r.entityId).slice(0, 8)}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={meta.page || 1} totalPages={meta.totalPages} onChange={setPage} />
    </div>
  );
}
