const express = require('express');
const controller = require('../controllers/downtimeController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('downtime:read'), controller.list);
router.get('/:id', requirePermission('downtime:read'), controller.get);
router.post('/', requirePermission('downtime:write'), controller.create);
router.put('/:id', requirePermission('downtime:write'), controller.update);
router.delete('/:id', requirePermission('downtime:delete'), controller.remove);

module.exports = router;
