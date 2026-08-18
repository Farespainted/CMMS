import React from 'react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900',
    danger: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-emerald-600',
  };
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tones[tone]}`}>{value}</div>
    </div>
  );
}

const STATUS_COLORS = {
  open: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
  operational: 'bg-emerald-100 text-emerald-700',
  down: 'bg-red-100 text-red-700',
  maintenance: 'bg-amber-100 text-amber-700',
  retired: 'bg-slate-100 text-slate-500',
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-purple-100 text-purple-700',
  received: 'bg-emerald-100 text-emerald-700',
};

export function StatusBadge({ value }) {
  const cls = STATUS_COLORS[value] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${cls}`}>{String(value || '').replace(/_/g, ' ')}</span>;
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={`card w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function LoadingRow({ colSpan = 6 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-8 text-slate-400">Loading...</td>
    </tr>
  );
}

export function EmptyRow({ colSpan = 6, message = 'No records found.' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-8 text-slate-400">{message}</td>
    </tr>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{message}</div>;
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 mt-4 text-sm">
      <button className="btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="text-slate-500">Page {page} of {totalPages}</span>
      <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
