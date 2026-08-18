const { Op } = require('sequelize');
const { Part, Vendor, InventoryTransaction, User, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { dispatchWebhookEvent } = require('../services/webhookDispatcher');

const include = [{ model: Vendor, as: 'preferredVendor', attributes: ['id', 'name'] }];

const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);
  const where = {};
  if (req.query.category) where.category = req.query.category;
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { partNumber: { [Op.like]: `%${req.query.search}%` } },
    ];
  }
  if (req.query.lowStock === 'true') {
    where[Op.and] = [sequelize.where(sequelize.col('quantity_on_hand'), Op.lte, sequelize.col('reorder_point'))];
  }
  const { rows, count } = await Part.findAndCountAll({
    where, include, order: [['name', 'ASC']], limit: pageSize, offset: (page - 1) * pageSize,
  });
  return ok(res, rows, { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) });
});

const get = asyncHandler(async (req, res) => {
  const part = await Part.findByPk(req.params.id, { include });
  if (!part) return fail(res, 404, 'Part not found');
  return ok(res, part);
});

const create = asyncHandler(async (req, res) => {
  const part = await Part.create(req.body);
  await recordAudit(req, { action: 'create', entityType: 'Part', entityId: part.id, changes: req.body });
  return created(res, part);
});

const update = asyncHandler(async (req, res) => {
  const part = await Part.findByPk(req.params.id);
  if (!part) return fail(res, 404, 'Part not found');
  await part.update(req.body);
  await recordAudit(req, { action: 'update', entityType: 'Part', entityId: part.id, changes: req.body });
  return ok(res, part);
});

const remove = asyncHandler(async (req, res) => {
  const part = await Part.findByPk(req.params.id);
  if (!part) return fail(res, 404, 'Part not found');
  await part.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'Part', entityId: req.params.id });
  return ok(res, { deleted: true });
});

// type: receive | adjust | return  (issue against a work order uses workOrderController.issuePart instead)
const applyTransaction = asyncHandler(async (req, res) => {
  const { type, quantity, notes } = req.body;
  if (!['receive', 'adjust', 'return'].includes(type)) {
    return fail(res, 400, 'type must be one of receive, adjust, return');
  }
  if (quantity === undefined) return fail(res, 400, 'quantity is required');

  const result = await sequelize.transaction(async (t) => {
    const part = await Part.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

    const txn = await InventoryTransaction.create({
      partId: part.id, type, quantity, notes,
      performedById: req.auth.type === 'user' ? req.auth.user.id : null,
    }, { transaction: t });

    if (type === 'adjust') {
      part.quantityOnHand = Number(quantity); // absolute set
    } else {
      part.quantityOnHand = Number(part.quantityOnHand) + Number(quantity);
    }
    await part.save({ transaction: t });
    return { txn, part };
  });

  await recordAudit(req, { action: type, entityType: 'Part', entityId: req.params.id, changes: { quantity } });
  return created(res, result.txn);
});

const listTransactions = asyncHandler(async (req, res) => {
  const transactions = await InventoryTransaction.findAll({
    where: { partId: req.params.id },
    include: [{ model: User, as: 'performedBy', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  return ok(res, transactions);
});

module.exports = { list, get, create, update, remove, applyTransaction, listTransactions };
