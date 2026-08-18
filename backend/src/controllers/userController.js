const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');
const { serializeUser } = require('./authController');

const list = asyncHandler(async (req, res) => {
  const users = await User.findAll({ include: Role, order: [['createdAt', 'DESC']] });
  return ok(res, users.map(serializeUser));
});

const get = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: Role });
  if (!user) return fail(res, 404, 'User not found');
  return ok(res, serializeUser(user));
});

const update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  const { name, phone, roleId, isActive, password } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (roleId !== undefined) user.roleId = roleId;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  await recordAudit(req, { action: 'update', entityType: 'User', entityId: user.id, changes: req.body });
  const fullUser = await User.findByPk(user.id, { include: Role });
  return ok(res, serializeUser(fullUser));
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return fail(res, 404, 'User not found');
  await user.destroy();
  await recordAudit(req, { action: 'delete', entityType: 'User', entityId: req.params.id });
  return ok(res, { deleted: true });
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll({ order: [['name', 'ASC']] });
  return ok(res, roles);
});

module.exports = { list, get, update, remove, listRoles };
