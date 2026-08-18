const { Op } = require('sequelize');
const asyncHandler = require('./asyncHandler');
const { ok, created, fail } = require('./apiResponse');
const { recordAudit } = require('../middleware/auditLogger');

// Generic CRUD controller factory for straightforward resources.
// entityType: string used in audit log entries (e.g. "Location").
// options.searchFields: string[] of columns matched by ?search=
// options.filterFields: string[] of columns that can be filtered via exact-match query params
// options.include: Sequelize include array applied to list/get
// options.defaultOrder: Sequelize order array
function crudFactory(Model, { entityType, searchFields = [], filterFields = [], include = [], defaultOrder = [['createdAt', 'DESC']] } = {}) {
  const list = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);

    const where = {};
    filterFields.forEach((field) => {
      if (req.query[field] !== undefined) where[field] = req.query[field];
    });
    if (req.query.search && searchFields.length) {
      where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.like]: `%${req.query.search}%` } }));
    }

    const { rows, count } = await Model.findAndCountAll({
      where,
      include,
      order: defaultOrder,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      distinct: true,
    });

    return ok(res, rows, { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) });
  });

  const get = asyncHandler(async (req, res) => {
    const record = await Model.findByPk(req.params.id, { include });
    if (!record) return fail(res, 404, `${entityType} not found`);
    return ok(res, record);
  });

  const create = asyncHandler(async (req, res) => {
    const record = await Model.create(req.body);
    await recordAudit(req, { action: 'create', entityType, entityId: record.id, changes: req.body });
    return created(res, record);
  });

  const update = asyncHandler(async (req, res) => {
    const record = await Model.findByPk(req.params.id);
    if (!record) return fail(res, 404, `${entityType} not found`);
    await record.update(req.body);
    await recordAudit(req, { action: 'update', entityType, entityId: record.id, changes: req.body });
    return ok(res, record);
  });

  const remove = asyncHandler(async (req, res) => {
    const record = await Model.findByPk(req.params.id);
    if (!record) return fail(res, 404, `${entityType} not found`);
    await record.destroy();
    await recordAudit(req, { action: 'delete', entityType, entityId: req.params.id });
    return ok(res, { deleted: true });
  });

  return { list, get, create, update, remove };
}

module.exports = crudFactory;
