const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created, fail } = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/auditLogger');

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    role: user.Role ? { id: user.Role.id, name: user.Role.name, permissions: user.Role.permissions } : null,
    lastLoginAt: user.lastLoginAt,
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 400, 'email and password are required');

  const user = await User.findOne({ where: { email }, include: Role });
  if (!user || !user.isActive) return fail(res, 401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return fail(res, 401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  await recordAudit(req, { action: 'login', entityType: 'User', entityId: user.id });
  return ok(res, { token, user: serializeUser(user) });
});

const me = asyncHandler(async (req, res) => {
  if (req.auth.type !== 'user') return fail(res, 400, 'Not a user session');
  return ok(res, serializeUser(req.auth.user));
});

// Admin-only: create a new user account.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, phone } = req.body;
  if (!name || !email || !password || !roleId) {
    return fail(res, 400, 'name, email, password, and roleId are required');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, roleId, phone });
  await recordAudit(req, { action: 'create', entityType: 'User', entityId: user.id, changes: { name, email, roleId } });
  const fullUser = await User.findByPk(user.id, { include: Role });
  return created(res, serializeUser(fullUser));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return fail(res, 400, 'currentPassword and newPassword are required');
  const user = req.auth.user;
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return fail(res, 401, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  await recordAudit(req, { action: 'change_password', entityType: 'User', entityId: user.id });
  return ok(res, { updated: true });
});

module.exports = { login, me, createUser, changePassword, serializeUser };
