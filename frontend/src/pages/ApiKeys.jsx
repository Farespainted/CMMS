import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', permissions: ['*'] };

export default function ApiKeys() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);

  const load = () => {
    client.get('/api-keys').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load API keys'));
  };
  useEffect(load, []);
  useEffect(() => { client.get('/api-keys/permission-catalog').then((res) => setCatalog(res.data.data)).catch(() => {}); }, []);

  const togglePermission = (perm) => {
    const has = form.permissions.includes(perm);
    if (perm === '*') { setForm({ ...form, permissions: has ? [] : ['*'] }); return; }
    let next = form.permissions.filter((p) => p !== '*');
    next = has ? next.filter((p) => p !== perm) : [...next, perm];
    setForm({ ...form, permissions: next });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await client.post('/api-keys', form);
      setCreatedKey(res.data.data.key);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create API key');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id) => {
    await client.put(`/api-keys/${id}`, { isActive: false });
    load();
  };

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Credentials for external systems to integrate with this CMMS over the REST API"
        actions={can('api_keys:write') && <button className="btn-primary" onClick={() => { setForm(emptyForm); setCreatedKey(null); setModalOpen(true); }}>+ New API key</button>}
      />
      <ErrorBanner message={error} />

      <div className="card p-4 mb-6 text-sm text-slate-600">
        External systems authenticate by sending the key in an <code className="bg-slate-100 px-1 rounded">X-API-Key</code> header.
        Full interactive API documentation (OpenAPI / Swagger) is available at <code className="bg-slate-100 px-1 rounded">/api/docs</code> on the backend.
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Key prefix</th><th>Permissions</th><th>Status</th><th>Last used</th><th></th></tr></thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td className="font-mono text-xs">{k.keyPrefix}...</td>
                <td className="text-xs">{k.permissions.join(', ')}</td>
                <td>{k.isActive ? <span className="badge bg-emerald-100 text-emerald-700">active</span> : <span className="badge bg-slate-100 text-slate-500">revoked</span>}</td>
                <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'never'}</td>
                <td>{k.isActive && can('api_keys:write') && <button className="text-red-600 hover:underline text-sm" onClick={() => revoke(k.id)}>Revoke</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No API keys yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New API key" width="max-w-xl">
        {createdKey ? (
          <div>
            <p className="text-sm text-slate-600 mb-2">Copy this key now — it will not be shown again.</p>
            <div className="bg-slate-900 text-emerald-300 font-mono text-sm p-3 rounded-md break-all select-all">{createdKey}</div>
            <button className="btn-primary mt-4" onClick={() => setModalOpen(false)}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Name</label><input className="input" required placeholder="e.g. ERP Integration" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <label className="label">Permissions</label>
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.permissions.includes('*')} onChange={() => togglePermission('*')} /> Full access (all permissions)
                </label>
                {catalog.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" disabled={form.permissions.includes('*')} checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} />
                    <span className="font-mono text-xs">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create key'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
