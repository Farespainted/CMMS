const express = require('express');
const controller = require('../controllers/auditLogController');
const { authenticate, requirePermission, requireUser } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireUser, requirePermission('audit_logs:read'));

router.get('/', controller.list);

module.exports = router;
