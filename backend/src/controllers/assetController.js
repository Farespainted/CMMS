const { Asset, Location, Meter, PreventiveMaintenance } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { generateCode } = require('../utils/idGen');
const { Op } = require('sequelize');

const include = [
  { model: Location },
  { association: 'parent', attributes: ['id', 'name', 'assetTag'] },
  { model: Meter },
];

const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);
  const where = {};
  ['status', 'criticality', 'category', 'locationId'].forEach((f) => {
    if (req.query[f] !== undefined) where[f] = req.query[f];
  });
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { assetTag: { [Op.like]: `%${req.query.search}%` } },
      { serialNumber: { [Op.like]: `%${req.query.search}%` } },
    ];
  }
  const { rows, count } = await Asset.findAndCountAll({
    where,
    include,
    order: [['name', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    distinct: true,
  });
  return ok(res, rows, { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) });
});

const get = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id, { include });
  if (!asset) return fail(res, 404, 'Asset not found');
  return ok(res, asset);
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.assetTag) body.assetTag = generateCode('AST');
  const asset = await Asset.create(body);
  await recordAudit(req, { action: 'create', entityType: 'Asset', entityId: asset.id, changes: body });
  return created(res, asset);
});

const update = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);
  if (!asset) return fail(res, 404, 'Asset not found');
  const previousStatus = asset.status;
  await asset.update(req.body);
  await recordAudit(req, { action: 'update', entityType: 'Asset', entityId: asset.id, changes: req.body });
  if (req.body.status && req.body.status !== previousStatus) {
    const { dispatchWebhookEvent } = require('../services/webhookDispatcher');
    dispatchWebhookEvent('asset.status_changed', {
      assetId: asset.id, assetTag: asset.assetTag, previousStatus, status: asset.status,
    }).catch(() => {});
  }
  return ok(res, asset);
});

const remove = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);
  if (!asset) return fail(res, 404, 'Asset not found');
  await asset.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'Asset', entityId: req.params.id });
  return ok(res, { deleted: true });
});

// Preventive maintenance schedules tied to this asset (convenience endpoint).
const listPmSchedules = asyncHandler(async (req, res) => {
  const schedules = await PreventiveMaintenance.findAll({ where: { assetId: req.params.id } });
  return ok(res, schedules);
});

module.exports = { list, get, create, update, remove, listPmSchedules };
