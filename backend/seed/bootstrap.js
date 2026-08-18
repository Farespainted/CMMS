// Shared demo-data creation, used by two callers:
//  - seed/seed.js: manual, destructive (drops and recreates everything) - for local dev.
//  - src/server.js: automatic, non-destructive (only runs if the database is empty) - so a
//    fresh production deploy (e.g. on Render) boots with working logins and sample data
//    without anyone needing shell/CLI access to run a seed script by hand.
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function createDemoData() {
  const {
    Role, User, Location, Asset, WorkOrder, WorkOrderTask,
    PreventiveMaintenance, Part, Vendor, Meter, ApiKey,
  } = require('../src/models');
  const { DEFAULT_ROLE_PERMISSIONS } = require('../src/utils/permissions');
  const { generateCode } = require('../src/utils/idGen');
  const { hashKey } = require('../src/middleware/auth');

  // Roles
  const roles = {};
  for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    roles[name] = await Role.create({ name, permissions, description: `${name} role` });
  }

  // Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cmms.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const admin = await User.create({
    name: 'System Administrator',
    email: adminEmail,
    passwordHash: await bcrypt.hash(adminPassword, 10),
    roleId: roles.admin.id,
  });

  const tech = await User.create({
    name: 'Alex Technician',
    email: 'tech@cmms.local',
    passwordHash: await bcrypt.hash('Tech123!', 10),
    roleId: roles.technician.id,
  });

  const manager = await User.create({
    name: 'Morgan Manager',
    email: 'manager@cmms.local',
    passwordHash: await bcrypt.hash('Manager123!', 10),
    roleId: roles.manager.id,
  });

  // Locations
  const plant = await Location.create({ name: 'Main Plant', code: 'PLANT-1', address: '100 Industrial Way' });
  const lineA = await Location.create({ name: 'Production Line A', code: 'LINE-A', parentId: plant.id });
  const warehouse = await Location.create({ name: 'Warehouse', code: 'WH-1', parentId: plant.id });

  // Vendors
  const vendor1 = await Vendor.create({ name: 'Acme Industrial Supply', email: 'sales@acmeindustrial.example', category: 'supplier' });
  await Vendor.create({ name: 'Precision Field Services', email: 'ops@precisionfs.example', category: 'contractor' });

  // Assets
  const conveyor = await Asset.create({
    name: 'Conveyor Belt #1', assetTag: generateCode('AST'), category: 'Conveyance',
    manufacturer: 'BeltCo', modelNumber: 'BC-4000', serialNumber: 'SN-88213',
    status: 'operational', criticality: 'high', locationId: lineA.id,
  });
  const compressor = await Asset.create({
    name: 'Air Compressor A', assetTag: generateCode('AST'), category: 'Utilities',
    manufacturer: 'Airflow Inc', modelNumber: 'AF-220', serialNumber: 'SN-55871',
    status: 'operational', criticality: 'critical', locationId: plant.id,
  });
  const forklift = await Asset.create({
    name: 'Forklift #2', assetTag: generateCode('AST'), category: 'Mobile Equipment',
    manufacturer: 'LiftPro', modelNumber: 'LP-900', serialNumber: 'SN-10021',
    status: 'down', criticality: 'medium', locationId: warehouse.id,
  });

  // Meter
  await Meter.create({ name: 'Forklift Hour Meter', unit: 'hours', currentReading: 1250, assetId: forklift.id });

  // Parts
  await Part.create({ name: 'Ball Bearing 6205', partNumber: 'BRG-6205', quantityOnHand: 4, reorderPoint: 5, reorderQuantity: 20, unitCost: 8.5, preferredVendorId: vendor1.id });
  await Part.create({ name: 'Hydraulic Fluid (5gal)', partNumber: 'HYD-FL-5G', quantityOnHand: 12, reorderPoint: 3, reorderQuantity: 10, unitCost: 42, preferredVendorId: vendor1.id });
  await Part.create({ name: 'Air Filter AF-220', partNumber: 'FLT-AF220', quantityOnHand: 2, reorderPoint: 2, reorderQuantity: 8, unitCost: 15.75, preferredVendorId: vendor1.id });

  // Preventive maintenance schedule
  await PreventiveMaintenance.create({
    name: 'Compressor Monthly Inspection',
    description: 'Check oil levels, belts, filters, and pressure relief valve.',
    assetId: compressor.id,
    frequencyType: 'months',
    frequencyValue: 1,
    leadTimeDays: 3,
    nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    assignedToId: tech.id,
    priority: 'high',
    checklistTemplate: ['Check oil level', 'Inspect drive belt', 'Test pressure relief valve', 'Replace air filter if dirty'],
  });

  // Work orders
  const wo1 = await WorkOrder.create({
    woNumber: generateCode('WO'),
    title: 'Conveyor belt making grinding noise',
    description: 'Operator reports grinding noise near drive motor.',
    type: 'corrective', priority: 'high', status: 'assigned',
    assetId: conveyor.id, locationId: lineA.id,
    assignedToId: tech.id, requestedById: manager.id,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  });
  await WorkOrderTask.bulkCreate([
    { workOrderId: wo1.id, description: 'Inspect drive motor bearings', sortOrder: 0 },
    { workOrderId: wo1.id, description: 'Lubricate chain', sortOrder: 1 },
  ]);

  await WorkOrder.create({
    woNumber: generateCode('WO'),
    title: 'Forklift hydraulic leak',
    description: 'Visible hydraulic fluid leak under mast.',
    type: 'corrective', priority: 'critical', status: 'open',
    assetId: forklift.id, locationId: warehouse.id,
    requestedById: manager.id,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // overdue on purpose for demo
  });

  await WorkOrder.create({
    woNumber: generateCode('WO'),
    title: 'Quarterly safety inspection - Line A',
    type: 'inspection', priority: 'medium', status: 'completed',
    assetId: conveyor.id, locationId: lineA.id,
    assignedToId: tech.id, requestedById: manager.id,
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    actualHours: 1.5,
    completionNotes: 'All safety guards intact. No issues found.',
  });

  // Demo API key for external system integration testing
  const rawKey = `cmms_${crypto.randomBytes(24).toString('hex')}`;
  await ApiKey.create({
    name: 'Demo Integration Key',
    keyPrefix: rawKey.slice(0, 12),
    keyHash: hashKey(rawKey),
    permissions: ['assets:read', 'work_orders:read', 'work_orders:write', 'reports:read'],
    createdById: admin.id,
  });

  return { adminEmail, adminPassword, demoApiKey: rawKey };
}

module.exports = { createDemoData };
