const express = require('express');
const controller = require('../controllers/purchaseOrderController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('purchase_orders:read'), controller.list);
router.get('/:id', requirePermission('purchase_orders:read'), controller.get);
router.post('/', requirePermission('purchase_orders:write'), controller.create);
router.put('/:id', requirePermission('purchase_orders:write'), controller.update);
router.delete('/:id', requirePermission('purchase_orders:delete'), controller.remove);
router.post('/:id/receive', requirePermission('purchase_orders:write'), controller.receive);

module.exports = router;
