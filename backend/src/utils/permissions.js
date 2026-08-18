// Permission catalog used across role-based access control (users) and
// API key scopes (external system integrations). A permission has the
// shape "<resource>:<action>" and "*" grants everything.

const RESOURCES = [
  'assets',
  'locations',
  'work_orders',
  'preventive_maintenance',
  'parts',
  'inventory',
  'vendors',
  'purchase_orders',
  'meters',
  'downtime',
  'users',
  'roles',
  'api_keys',
  'webhooks',
  'audit_logs',
  'reports',
];

const ACTIONS = ['read', 'write', 'delete'];

const ALL_PERMISSIONS = RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}:${a}`));

const DEFAULT_ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: RESOURCES.filter((r) => r !== 'roles' && r !== 'api_keys').flatMap((r) => ACTIONS.map((a) => `${r}:${a}`))
    .concat(['roles:read', 'api_keys:read']),
  technician: [
    'assets:read', 'locations:read',
    'work_orders:read', 'work_orders:write',
    'preventive_maintenance:read',
    'parts:read', 'inventory:read', 'inventory:write',
    'meters:read', 'meters:write',
    'downtime:read', 'downtime:write',
    'reports:read',
  ],
  requester: [
    'assets:read', 'locations:read',
    'work_orders:read', 'work_orders:write', // can create/view their own requests
    'reports:read',
  ],
};

function hasPermission(grantedPermissions, required) {
  if (!Array.isArray(grantedPermissions)) return false;
  if (grantedPermissions.includes('*')) return true;
  if (grantedPermissions.includes(required)) return true;
  // resource-level wildcard, e.g. "assets:*"
  const [resource] = required.split(':');
  return grantedPermissions.includes(`${resource}:*`);
}

module.exports = { RESOURCES, ACTIONS, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, hasPermission };
