const express = require('express');
const controller = require('../controllers/meterController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('meters:read'), controller.list);
router.get('/:id', requirePermission('meters:read'), controller.get);
router.post('/', requirePermission('meters:write'), controller.create);
router.put('/:id', requirePermission('meters:write'), controller.update);
router.delete('/:id', requirePermission('meters:delete'), controller.remove);
router.post('/:id/readings', requirePermission('meters:write'), controller.addReading);

module.exports = router;
