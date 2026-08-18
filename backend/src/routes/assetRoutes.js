const express = require('express');
const controller = require('../controllers/assetController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('assets:read'), controller.list);
router.get('/:id', requirePermission('assets:read'), controller.get);
router.get('/:id/pm-schedules', requirePermission('preventive_maintenance:read'), controller.listPmSchedules);
router.post('/', requirePermission('assets:write'), controller.create);
router.put('/:id', requirePermission('assets:write'), controller.update);
router.delete('/:id', requirePermission('assets:delete'), controller.remove);

module.exports = router;
