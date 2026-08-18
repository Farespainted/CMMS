const { Op } = require('sequelize');
const {
  WorkOrder, WorkOrderTask, Asset, Location, User, Part, InventoryTransaction, sequelize,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { generateCode } = require('../utils/idGen');
const { dispatchWebhookEvent } = require('../services/webhookDispatcher');

const include = [
  { model: Asset, attributes: ['id', 'name', 'assetTag', 'status'] },
  { model: Location, attributes: ['id', 'name'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
  { association: 'tasks' },
];

const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);
  const where = {};
  ['status', 'priority', 'type', 'assetId', 'assignedToId', 'locationId'].forEach((f) => {
    if (req.query[f] !== undefined) where[f] = req.query[f];
  });
  if (req.query.overdue === 'true') {
    where.dueDate = { [Op.lt]: new Date() };
    where.status = { [Op.notIn]: ['completed', 'cancelled'] };
  }
  if (req.query.search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${req.query.search}%` } },
      { woNumber: { [Op.like]: `%${req.query.search}%` } },
    ];
  }
  const { rows, count } = await WorkOrder.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    distinct: true,
  });
  return ok(res, rows, { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) });
});

const get = asyncHandler(async (req, res) => {
  const wo = await WorkOrder.findByPk(req.params.id, {
    include: [...include, { model: InventoryTransaction, include: [Part] }],
  });
  if (!wo) return fail(res, 404, 'Work order not found');
  return ok(res, wo);
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.woNumber) body.woNumber = generateCode('WO');
  if (!body.requestedById && req.auth.type === 'user') body.requestedById = req.auth.user.id;
  body.createdVia = req.auth.type === 'api_key' ? 'api' : 'web';
  if (body.assignedToId && body.status === undefined) body.status = 'assigned';

  const tasks = body.tasks;
  delete body.tasks;

  const wo = await WorkOrder.create(body);
  if (Array.isArray(tasks) && tasks.length) {
    await WorkOrderTask.bulkCreate(
      tasks.map((t, i) => ({
        workOrderId: wo.id,
        description: typeof t === 'string' ? t : t.description,
        sortOrder: i,
      }))
    );
  }
  await recordAudit(req, { action: 'create', entityType: 'WorkOrder', entityId: wo.id, changes: body });

  const full = await WorkOrder.findByPk(wo.id, { include });
  dispatchWebhookEvent('work_order.created', full.toJSON()).catch(() => {});
  return created(res, full);
});

const update = asyncHandler(async (req, res) => {
  const wo = await WorkOrder.findByPk(req.params.id);
  if (!wo) return fail(res, 404, 'Work order not found');

  const previousStatus = wo.status;
  const body = { ...req.body };

  if (body.status === 'in_progress' && !wo.startedAt) body.startedAt = new Date();
  if (body.status === 'completed' && !wo.completedAt) body.completedAt = new Date();

  await wo.update(body);
  await recordAudit(req, { action: 'update', entityType: 'WorkOrder', entityId: wo.id, changes: body });

  const full = await WorkOrder.findByPk(wo.id, { include });

  if (body.status && body.status !== previousStatus) {
    dispatchWebhookEvent('work_order.status_changed', {
      ...full.toJSON(), previousStatus,
    }).catch(() => {});
    if (body.status === 'completed') {
      dispatchWebhookEvent('work_order.completed', full.toJSON()).catch(() => {});
    }
  }

  return ok(res, full);
});

const remove = asyncHandler(async (req, res) => {
  const wo = await WorkOrder.findByPk(req.params.id);
  if (!wo) return fail(res, 404, 'Work order not found');
  await wo.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'WorkOrder', entityId: req.params.id });
  return ok(res, { deleted: true });
});

// ---- Checklist tasks ----

const addTask = asyncHandler(async (req, res) => {
  const wo = await WorkOrder.findByPk(req.params.id);
  if (!wo) return fail(res, 404, 'Work order not found');
  const count = await WorkOrderTask.count({ where: { workOrderId: wo.id } });
  const task = await WorkOrderTask.create({
    workOrderId: wo.id,
    description: req.body.description,
    sortOrder: count,
  });
  return created(res, task);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await WorkOrderTask.findOne({ where: { id: req.params.taskId, workOrderId: req.params.id } });
  if (!task) return fail(res, 404, 'Task not found');
  if (req.body.isCompleted !== undefined) {
    task.isCompleted = req.body.isCompleted;
    task.completedAt = req.body.isCompleted ? new Date() : null;
    if (req.body.isCompleted && req.auth.type === 'user') task.completedById = req.auth.user.id;
  }
  if (req.body.description !== undefined) task.description = req.body.description;
  await task.save();
  return ok(res, task);
});

const removeTask = asyncHandler(async (req, res) => {
  const task = await WorkOrderTask.findOne({ where: { id: req.params.taskId, workOrderId: req.params.id } });
  if (!task) return fail(res, 404, 'Task not found');
  await task.destroy();
  return ok(res, { deleted: true });
});

// ---- Parts usage: issues inventory against this work order and decrements stock ----

const issuePart = asyncHandler(async (req, res) => {
  const { partId, quantity, notes } = req.body;
  if (!partId || !quantity) return fail(res, 400, 'partId and quantity are required');

  const wo = await WorkOrder.findByPk(req.params.id);
  if (!wo) return fail(res, 404, 'Work order not found');

  const result = await sequelize.transaction(async (t) => {
    const part = await Part.findByPk(partId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

    const txn = await InventoryTransaction.create({
      partId, quantity, type: 'issue', notes,
      workOrderId: wo.id,
      performedById: req.auth.type === 'user' ? req.auth.user.id : null,
    }, { transaction: t });

    part.quantityOnHand = Number(part.quantityOnHand) - Number(quantity);
    await part.save({ transaction: t });

    return { txn, part };
  });

  await recordAudit(req, { action: 'issue_part', entityType: 'WorkOrder', entityId: wo.id, changes: { partId, quantity } });

  if (Number(result.part.quantityOnHand) <= Number(result.part.reorderPoint)) {
    dispatchWebhookEvent('part.low_stock', {
      partId: result.part.id, partNumber: result.part.partNumber, quantityOnHand: result.part.quantityOnHand, reorderPoint: result.part.reorderPoint,
    }).catch(() => {});
  }

  return created(res, result.txn);
});

module.exports = { list, get, create, update, remove, addTask, updateTask, removeTask, issuePart };
