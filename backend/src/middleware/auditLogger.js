const { AuditLog } = require('../models');

// Call this from controllers after a mutating action to record who did what.
// Never throws - audit logging failures must not break the primary request.
async function recordAudit(req, { action, entityType, entityId, changes }) {
  try {
    const actorType = req.auth?.type === 'api_key' ? 'api_key' : req.auth?.type === 'user' ? 'user' : 'system';
    await AuditLog.create({
      actorType,
      actorLabel: req.auth?.actorLabel || 'system',
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      changes: changes || null,
      ipAddress: req.ip,
      userId: req.auth?.type === 'user' ? req.auth.user.id : null,
      apiKeyId: req.auth?.type === 'api_key' ? req.auth.apiKey.id : null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { recordAudit };
