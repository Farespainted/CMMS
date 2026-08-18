import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHeader, Modal, ErrorBanner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', email: '', password: '', roleId: '', phone: '' };

export default function Users() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/users').then((res) => setRows(res.data.data)).catch((err) => setError(err.response?.data?.error?.message || 'Failed to load users'));
  };
  useEffect(load, []);
  useEffect(() => { client.get('/users/roles').then((res) => setRoles(res.data.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/auth/users', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    await client.put(`/users/${u.id}`, { isActive: !u.isActive });
    load();
  };

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Manage accounts and permissions" actions={can('users:write') && <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New user</button>} />
      <ErrorBanner message={error} />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td className="capitalize">{u.role?.name}</td>
                <td>{u.isActive ? <span className="badge bg-emerald-100 text-emerald-700">active</span> : <span className="badge bg-slate-100 text-slate-500">disabled</span>}</td>
                <td>{can('users:write') && <button className="text-brand-600 hover:underline text-sm" onClick={() => toggleActive(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New user">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Temporary password</label><input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">Select role...</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create user'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
