import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assets from './pages/Assets.jsx';
import AssetDetail from './pages/AssetDetail.jsx';
import WorkOrders from './pages/WorkOrders.jsx';
import WorkOrderDetail from './pages/WorkOrderDetail.jsx';
import PreventiveMaintenance from './pages/PreventiveMaintenance.jsx';
import Inventory from './pages/Inventory.jsx';
import Meters from './pages/Meters.jsx';
import DowntimeLogs from './pages/DowntimeLogs.jsx';
import Vendors from './pages/Vendors.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import Locations from './pages/Locations.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import ApiKeys from './pages/ApiKeys.jsx';
import Webhooks from './pages/Webhooks.jsx';
import AuditLog from './pages/AuditLog.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="preventive-maintenance" element={<PreventiveMaintenance />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="meters" element={<Meters />} />
        <Route path="downtime-logs" element={<DowntimeLogs />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="locations" element={<Locations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="audit-log" element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
