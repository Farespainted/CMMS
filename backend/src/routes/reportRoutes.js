const express = require('express');
const controller = require('../controllers/reportController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requirePermission('reports:read'));

router.get('/dashboard', controller.dashboard);
router.get('/assets/:assetId/reliability', controller.assetReliability);

module.exports = router;
