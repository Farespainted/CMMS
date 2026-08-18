const { Meter, MeterReading, Asset, User, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');

const include = [{ model: Asset, attributes: ['id', 'name', 'assetTag'] }];

const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.assetId) where.assetId = req.query.assetId;
  const meters = await Meter.findAll({ where, include, order: [['name', 'ASC']] });
  return ok(res, meters);
});

const get = asyncHandler(async (req, res) => {
  const meter = await Meter.findByPk(req.params.id, {
    include: [...include, { model: MeterReading, as: 'readings', order: [['recordedAt', 'DESC']], limit: 50, separate: true }],
  });
  if (!meter) return fail(res, 404, 'Meter not found');
  return ok(res, meter);
});

const create = asyncHandler(async (req, res) => {
  const meter = await Meter.create(req.body);
  await recordAudit(req, { action: 'create', entityType: 'Meter', entityId: meter.id, changes: req.body });
  return created(res, meter);
});

const update = asyncHandler(async (req, res) => {
  const meter = await Meter.findByPk(req.params.id);
  if (!meter) return fail(res, 404, 'Meter not found');
  await meter.update(req.body);
  await recordAudit(req, { action: 'update', entityType: 'Meter', entityId: meter.id, changes: req.body });
  return ok(res, meter);
});

const remove = asyncHandler(async (req, res) => {
  const meter = await Meter.findByPk(req.params.id);
  if (!meter) return fail(res, 404, 'Meter not found');
  await meter.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'Meter', entityId: req.params.id });
  return ok(res, { deleted: true });
});

const addReading = asyncHandler(async (req, res) => {
  const { reading, notes, recordedAt } = req.body;
  if (reading === undefined) return fail(res, 400, 'reading is required');

  const result = await sequelize.transaction(async (t) => {
    const meter = await Meter.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!meter) throw Object.assign(new Error('Meter not found'), { status: 404 });
    const record = await MeterReading.create({
      meterId: meter.id, reading, notes, recordedAt: recordedAt || new Date(),
      recordedById: req.auth.type === 'user' ? req.auth.user.id : null,
    }, { transaction: t });
    meter.currentReading = reading;
    await meter.save({ transaction: t });
    return record;
  });

  await recordAudit(req, { action: 'add_reading', entityType: 'Meter', entityId: req.params.id, changes: { reading } });
  return created(res, result);
});

module.exports = { list, get, create, update, remove, addReading };
