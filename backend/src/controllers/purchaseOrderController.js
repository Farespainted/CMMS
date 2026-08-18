const { PurchaseOrder, PurchaseOrderItem, Vendor, Part, InventoryTransaction, User, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { generateCode } = require('../utils/idGen');

const include = [
  { model: Vendor, attributes: ['id', 'name', 'email'] },
  { model: PurchaseOrderItem, as: 'items', include: [{ model: Part, attributes: ['id', 'name', 'partNumber'] }] },
  { model: User, as: 'createdBy', attributes: ['id', 'name'] },
];

const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.vendorId) where.vendorId = req.query.vendorId;
  const orders = await PurchaseOrder.findAll({ where, include, order: [['createdAt', 'DESC']] });
  return ok(res, orders);
});

const get = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include });
  if (!po) return fail(res, 404, 'Purchase order not found');
  return ok(res, po);
});

const create = asyncHandler(async (req, res) => {
  const { items = [], ...body } = req.body;
  if (!body.poNumber) body.poNumber = generateCode('PO');
  if (req.auth.type === 'user') body.createdById = req.auth.user.id;
  body.totalAmount = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitCost), 0);

  const po = await PurchaseOrder.create(body);
  if (items.length) {
    await PurchaseOrderItem.bulkCreate(items.map((it) => ({ ...it, purchaseOrderId: po.id })));
  }
  await recordAudit(req, { action: 'create', entityType: 'PurchaseOrder', entityId: po.id, changes: body });
  const full = await PurchaseOrder.findByPk(po.id, { include });
  return created(res, full);
});

const update = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return fail(res, 404, 'Purchase order not found');
  await po.update(req.body);
  await recordAudit(req, { action: 'update', entityType: 'PurchaseOrder', entityId: po.id, changes: req.body });
  const full = await PurchaseOrder.findByPk(po.id, { include });
  return ok(res, full);
});

const remove = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return fail(res, 404, 'Purchase order not found');
  await po.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'PurchaseOrder', entityId: req.params.id });
  return ok(res, { deleted: true });
});

// Marks a PO received: for each item tied to a Part, increments stock and logs an inventory transaction.
const receive = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include });
  if (!po) return fail(res, 404, 'Purchase order not found');

  await sequelize.transaction(async (t) => {
    for (const item of po.items) {
      const receivedQty = item.quantity; // full receipt for simplicity
      item.quantityReceived = receivedQty;
      await item.save({ transaction: t });

      if (item.partId) {
        const part = await Part.findByPk(item.partId, { transaction: t, lock: t.LOCK.UPDATE });
        if (part) {
          part.quantityOnHand = Number(part.quantityOnHand) + Number(receivedQty);
          await part.save({ transaction: t });
          await InventoryTransaction.create({
            partId: part.id, type: 'receive', quantity: receivedQty,
            notes: `Received via PO ${po.poNumber}`,
            performedById: req.auth.type === 'user' ? req.auth.user.id : null,
          }, { transaction: t });
        }
      }
    }
    po.status = 'received';
    po.receivedDate = new Date();
    await po.save({ transaction: t });
  });

  await recordAudit(req, { action: 'receive', entityType: 'PurchaseOrder', entityId: po.id });
  const full = await PurchaseOrder.findByPk(po.id, { include });
  return ok(res, full);
});

module.exports = { list, get, create, update, remove, receive };
