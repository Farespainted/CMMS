const express = require('express');
const controller = require('../controllers/pmController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('preventive_maintenance:read'), controller.list);
router.get('/:id', requirePermission('preventive_maintenance:read'), controller.get);
router.post('/', requirePermission('preventive_maintenance:write'), controller.create);
router.put('/:id', requirePermission('preventive_maintenance:write'), controller.update);
router.delete('/:id', requirePermission('preventive_maintenance:delete'), controller.remove);
router.post('/:id/generate', requirePermission('preventive_maintenance:write'), controller.generateNow);

module.exports = router;
