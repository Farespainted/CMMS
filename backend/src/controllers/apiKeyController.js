const crypto = require('crypto');
const { ApiKey, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { hashKey } = require('../middleware/auth');
const { ALL_PERMISSIONS } = require('../utils/permissions');

function serialize(apiKey) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    permissions: apiKey.permissions,
    isActive: apiKey.isActive,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
    creator: apiKey.creator ? { id: apiKey.creator.id, name: apiKey.creator.name } : undefined,
  };
}

const list = asyncHandler(async (req, res) => {
  const keys = await ApiKey.findAll({ include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] });
  return ok(res, keys.map(serialize));
});

// Returns the raw secret ONCE, at creation time. It is never retrievable again.
const create = asyncHandler(async (req, res) => {
  const { name, permissions, expiresAt } = req.body;
  if (!name) return fail(res, 400, 'name is required');
  const perms = Array.isArray(permissions) && permissions.length ? permissions : ['*'];
  const invalid = perms.filter((p) => p !== '*' && !ALL_PERMISSIONS.includes(p) && !p.endsWith(':*'));
  if (invalid.length) return fail(res, 400, `Unknown permissions: ${invalid.join(', ')}`);

  const rawKey = `cmms_${crypto.randomBytes(24).toString('hex')}`;
  const apiKey = await ApiKey.create({
    name,
    keyPrefix: rawKey.slice(0, 12),
    keyHash: hashKey(rawKey),
    permissions: perms,
    expiresAt: expiresAt || null,
    createdById: req.auth.type === 'user' ? req.auth.user.id : null,
  });

  await recordAudit(req, { action: 'create', entityType: 'ApiKey', entityId: apiKey.id, changes: { name, permissions: perms } });

  return created(res, { ...serialize(apiKey), key: rawKey });
});

const update = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findByPk(req.params.id);
  if (!apiKey) return fail(res, 404, 'API key not found');
  const { name, permissions, isActive, expiresAt } = req.body;
  if (name !== undefined) apiKey.name = name;
  if (permissions !== undefined) apiKey.permissions = permissions;
  if (isActive !== undefined) apiKey.isActive = isActive;
  if (expiresAt !== undefined) apiKey.expiresAt = expiresAt;
  await apiKey.save();
  await recordAudit(req, { action: 'update', entityType: 'ApiKey', entityId: apiKey.id, changes: req.body });
  return ok(res, serialize(apiKey));
});

const remove = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findByPk(req.params.id);
  if (!apiKey) return fail(res, 404, 'API key not found');
  await apiKey.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'ApiKey', entityId: req.params.id });
  return ok(res, { deleted: true });
});

const listPermissionCatalog = asyncHandler(async (req, res) => ok(res, ALL_PERMISSIONS));

module.exports = { list, create, update, remove, listPermissionCatalog };
