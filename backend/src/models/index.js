const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = require('./Role')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const ApiKey = require('./ApiKey')(sequelize, DataTypes);
const Location = require('./Location')(sequelize, DataTypes);
const Asset = require('./Asset')(sequelize, DataTypes);
const WorkOrder = require('./WorkOrder')(sequelize, DataTypes);
const WorkOrderTask = require('./WorkOrderTask')(sequelize, DataTypes);
const PreventiveMaintenance = require('./PreventiveMaintenance')(sequelize, DataTypes);
const Part = require('./Part')(sequelize, DataTypes);
const InventoryTransaction = require('./InventoryTransaction')(sequelize, DataTypes);
const Vendor = require('./Vendor')(sequelize, DataTypes);
const PurchaseOrder = require('./PurchaseOrder')(sequelize, DataTypes);
const PurchaseOrderItem = require('./PurchaseOrderItem')(sequelize, DataTypes);
const Meter = require('./Meter')(sequelize, DataTypes);
const MeterReading = require('./MeterReading')(sequelize, DataTypes);
const DowntimeLog = require('./DowntimeLog')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);
const Webhook = require('./Webhook')(sequelize, DataTypes);

// ---- Associations ----

// Role <-> User
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// User -> ApiKey (creator)
User.hasMany(ApiKey, { foreignKey: 'createdById', as: 'createdApiKeys' });
ApiKey.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Location hierarchy
Location.hasMany(Location, { foreignKey: 'parentId', as: 'children' });
Location.belongsTo(Location, { foreignKey: 'parentId', as: 'parent' });

// Location <-> Asset
Location.hasMany(Asset, { foreignKey: 'locationId' });
Asset.belongsTo(Location, { foreignKey: 'locationId' });

// Asset hierarchy (parent/child equipment)
Asset.hasMany(Asset, { foreignKey: 'parentId', as: 'children' });
Asset.belongsTo(Asset, { foreignKey: 'parentId', as: 'parent' });

// Asset <-> WorkOrder
Asset.hasMany(WorkOrder, { foreignKey: 'assetId' });
WorkOrder.belongsTo(Asset, { foreignKey: 'assetId' });

// Location <-> WorkOrder
Location.hasMany(WorkOrder, { foreignKey: 'locationId' });
WorkOrder.belongsTo(Location, { foreignKey: 'locationId' });

// User <-> WorkOrder (assigned / requested)
User.hasMany(WorkOrder, { foreignKey: 'assignedToId', as: 'assignedWorkOrders' });
WorkOrder.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
User.hasMany(WorkOrder, { foreignKey: 'requestedById', as: 'requestedWorkOrders' });
WorkOrder.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });

// WorkOrder <-> WorkOrderTask
WorkOrder.hasMany(WorkOrderTask, { foreignKey: 'workOrderId', as: 'tasks', onDelete: 'CASCADE' });
WorkOrderTask.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });
User.hasMany(WorkOrderTask, { foreignKey: 'completedById' });
WorkOrderTask.belongsTo(User, { foreignKey: 'completedById', as: 'completedBy' });

// Asset <-> PreventiveMaintenance
Asset.hasMany(PreventiveMaintenance, { foreignKey: 'assetId' });
PreventiveMaintenance.belongsTo(Asset, { foreignKey: 'assetId' });
User.hasMany(PreventiveMaintenance, { foreignKey: 'assignedToId' });
PreventiveMaintenance.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// PreventiveMaintenance -> WorkOrder (generated work orders)
PreventiveMaintenance.hasMany(WorkOrder, { foreignKey: 'pmScheduleId', as: 'generatedWorkOrders' });
WorkOrder.belongsTo(PreventiveMaintenance, { foreignKey: 'pmScheduleId', as: 'pmSchedule' });

// Vendor <-> Part (preferred vendor)
Vendor.hasMany(Part, { foreignKey: 'preferredVendorId' });
Part.belongsTo(Vendor, { foreignKey: 'preferredVendorId', as: 'preferredVendor' });

// Part <-> InventoryTransaction
Part.hasMany(InventoryTransaction, { foreignKey: 'partId', as: 'transactions' });
InventoryTransaction.belongsTo(Part, { foreignKey: 'partId' });
WorkOrder.hasMany(InventoryTransaction, { foreignKey: 'workOrderId' });
InventoryTransaction.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });
User.hasMany(InventoryTransaction, { foreignKey: 'performedById' });
InventoryTransaction.belongsTo(User, { foreignKey: 'performedById', as: 'performedBy' });

// Vendor <-> PurchaseOrder
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendorId' });
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendorId' });
User.hasMany(PurchaseOrder, { foreignKey: 'createdById' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// PurchaseOrder <-> PurchaseOrderItem
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });
Part.hasMany(PurchaseOrderItem, { foreignKey: 'partId' });
PurchaseOrderItem.belongsTo(Part, { foreignKey: 'partId' });

// Asset <-> Meter
Asset.hasMany(Meter, { foreignKey: 'assetId' });
Meter.belongsTo(Asset, { foreignKey: 'assetId' });
Meter.hasMany(MeterReading, { foreignKey: 'meterId', as: 'readings' });
MeterReading.belongsTo(Meter, { foreignKey: 'meterId' });
User.hasMany(MeterReading, { foreignKey: 'recordedById' });
MeterReading.belongsTo(User, { foreignKey: 'recordedById', as: 'recordedBy' });

// Asset <-> DowntimeLog
Asset.hasMany(DowntimeLog, { foreignKey: 'assetId' });
DowntimeLog.belongsTo(Asset, { foreignKey: 'assetId' });
WorkOrder.hasMany(DowntimeLog, { foreignKey: 'workOrderId' });
DowntimeLog.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });

// AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });
ApiKey.hasMany(AuditLog, { foreignKey: 'apiKeyId' });
AuditLog.belongsTo(ApiKey, { foreignKey: 'apiKeyId' });

// Webhook
User.hasMany(Webhook, { foreignKey: 'createdById' });
Webhook.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = {
  sequelize,
  Role,
  User,
  ApiKey,
  Location,
  Asset,
  WorkOrder,
  WorkOrderTask,
  PreventiveMaintenance,
  Part,
  InventoryTransaction,
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  Meter,
  MeterReading,
  DowntimeLog,
  AuditLog,
  Webhook,
};
