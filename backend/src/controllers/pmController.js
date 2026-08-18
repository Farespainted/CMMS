const { PreventiveMaintenance, Asset, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { generateWorkOrderFromPM } = require('../services/pmScheduler');

const include = [
  { model: Asset, attributes: ['id', 'name', 'assetTag'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
];

const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.assetId) where.assetId = req.query.assetId;
  if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
  const schedules = await PreventiveMaintenance.findAll({ where, include, order: [['nextDueDate', 'ASC']] });
  return ok(res, schedules);
});

const get = asyncHandler(async (req, res) => {
  const pm = await PreventiveMaintenance.findByPk(req.params.id, { include });
  if (!pm) return fail(res, 404, 'PM schedule not found');
  return ok(res, pm);
});

const create = asyncHandler(async (req, res) => {
  const pm = await PreventiveMaintenance.create(req.body);
  await recordAudit(req, { action: 'create', entityType: 'PreventiveMaintenance', entityId: pm.id, changes: req.body });
  return created(res, pm);
});

const update = asyncHandler(async (req, res) => {
  const pm = await PreventiveMaintenance.findByPk(req.params.id);
  if (!pm) return fail(res, 404, 'PM schedule not found');
  await pm.update(req.body);
  await recordAudit(req, { action: 'update', entityType: 'PreventiveMaintenance', entityId: pm.id, changes: req.body });
  return ok(res, pm);
});

const remove = asyncHandler(async (req, res) => {
  const pm = await PreventiveMaintenance.findByPk(req.params.id);
  if (!pm) return fail(res, 404, 'PM schedule not found');
  await pm.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'PreventiveMaintenance', entityId: req.params.id });
  return ok(res, { deleted: true });
});

// Manually trigger generation of the next work order from this schedule, regardless of due date.
const generateNow = asyncHandler(async (req, res) => {
  const pm = await PreventiveMaintenance.findByPk(req.params.id);
  if (!pm) return fail(res, 404, 'PM schedule not found');
  const wo = await generateWorkOrderFromPM(pm, { force: true });
  await recordAudit(req, { action: 'generate_work_order', entityType: 'PreventiveMaintenance', entityId: pm.id, changes: { workOrderId: wo.id } });
  return created(res, wo);
});

module.exports = { list, get, create, update, remove, generateNow };
