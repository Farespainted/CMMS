const express = require('express');
const controller = require('../controllers/workOrderController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('work_orders:read'), controller.list);
router.get('/:id', requirePermission('work_orders:read'), controller.get);
router.post('/', requirePermission('work_orders:write'), controller.create);
router.put('/:id', requirePermission('work_orders:write'), controller.update);
router.delete('/:id', requirePermission('work_orders:delete'), controller.remove);

router.post('/:id/tasks', requirePermission('work_orders:write'), controller.addTask);
router.put('/:id/tasks/:taskId', requirePermission('work_orders:write'), controller.updateTask);
router.delete('/:id/tasks/:taskId', requirePermission('work_orders:write'), controller.removeTask);

router.post('/:id/parts', requirePermission('inventory:write'), controller.issuePart);

module.exports = router;
