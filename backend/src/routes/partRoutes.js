const express = require('express');
const controller = require('../controllers/partController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('parts:read'), controller.list);
router.get('/:id', requirePermission('parts:read'), controller.get);
router.post('/', requirePermission('parts:write'), controller.create);
router.put('/:id', requirePermission('parts:write'), controller.update);
router.delete('/:id', requirePermission('parts:delete'), controller.remove);

router.get('/:id/transactions', requirePermission('inventory:read'), controller.listTransactions);
router.post('/:id/transactions', requirePermission('inventory:write'), controller.applyTransaction);

module.exports = router;
