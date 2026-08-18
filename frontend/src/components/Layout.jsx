import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/work-orders', label: 'Work Orders' },
  { to: '/assets', label: 'Assets' },
  { to: '/preventive-maintenance', label: 'Preventive Maintenance' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/meters', label: 'Meters' },
  { to: '/downtime-logs', label: 'Downtime Logs' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/purchase-orders', label: 'Purchase Orders' },
  { to: '/locations', label: 'Locations' },
  { to: '/reports', label: 'Reports' },
];

const ADMIN_NAV = [
  { to: '/users', label: 'Users & Roles' },
  { to: '/api-keys', label: 'API Keys' },
  { to: '/webhooks', label: 'Webhooks' },
  { to: '/audit-log', label: 'Audit Log' },
];

export default function Layout() {
  const { user, logout, can } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-4 py-4 text-lg font-semibold text-white border-b border-slate-800">
          CMMS
        </div>
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm rounded-md mx-2 ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {can('users:read') && (
            <>
              <div className="mt-4 mb-1 px-4 text-xs uppercase tracking-wide text-slate-500">Administration</div>
              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm rounded-md mx-2 ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800 text-sm">
          <div className="font-medium text-white">{user?.name}</div>
          <div className="text-slate-400 text-xs">{user?.role?.name}</div>
          <button onClick={logout} className="mt-2 text-xs text-brand-300 hover:text-brand-200">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-slate-50">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
