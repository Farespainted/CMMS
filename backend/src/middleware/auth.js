const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role, ApiKey } = require('../models');
const { hasPermission } = require('../utils/permissions');
const { fail } = require('../utils/apiResponse');

const API_KEY_HEADER = 'x-api-key';

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// Authenticates either a logged-in user (JWT bearer token) or an external
// system (X-API-Key header). Populates req.auth = { type, permissions, user?, apiKey? }.
async function authenticate(req, res, next) {
  try {
    const apiKeyHeader = req.header(API_KEY_HEADER);
    const authHeader = req.header('authorization');

    if (apiKeyHeader) {
      const keyHash = hashKey(apiKeyHeader);
      const apiKey = await ApiKey.findOne({ where: { keyHash } });
      if (!apiKey || !apiKey.isActive) {
        return fail(res, 401, 'Invalid or inactive API key');
      }
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return fail(res, 401, 'API key has expired');
      }
      apiKey.lastUsedAt = new Date();
      await apiKey.save();
      req.auth = {
        type: 'api_key',
        permissions: apiKey.permissions,
        apiKey,
        actorLabel: `API key: ${apiKey.name}`,
      };
      return next();
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        return fail(res, 401, 'Invalid or expired token');
      }
      const user = await User.findByPk(payload.sub, { include: Role });
      if (!user || !user.isActive) {
        return fail(res, 401, 'User not found or inactive');
      }
      req.auth = {
        type: 'user',
        permissions: user.Role ? user.Role.permissions : [],
        user,
        actorLabel: user.email,
      };
      return next();
    }

    return fail(res, 401, 'Authentication required (Bearer token or X-API-Key header)');
  } catch (err) {
    return next(err);
  }
}

// Middleware factory: requires the authenticated principal to hold `permission`.
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.auth) return fail(res, 401, 'Authentication required');
    if (!hasPermission(req.auth.permissions, permission)) {
      return fail(res, 403, `Missing required permission: ${permission}`);
    }
    return next();
  };
}

// Restrict a route to logged-in human users only (e.g. managing other users, roles).
function requireUser(req, res, next) {
  if (!req.auth || req.auth.type !== 'user') {
    return fail(res, 403, 'This action requires a logged-in user account');
  }
  return next();
}

module.exports = { authenticate, requirePermission, requireUser, hashKey };
