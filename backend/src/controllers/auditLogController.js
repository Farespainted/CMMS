const { AuditLog } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 200);
  const where = {};
  if (req.query.entityType) where.entityType = req.query.entityType;
  if (req.query.entityId) where.entityId = req.query.entityId;
  if (req.query.action) where.action = req.query.action;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return ok(res, rows, { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) });
});

module.exports = { list };
