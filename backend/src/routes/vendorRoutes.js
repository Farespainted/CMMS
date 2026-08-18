const express = require('express');
const controller = require('../controllers/vendorController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('vendors:read'), controller.list);
router.get('/:id', requirePermission('vendors:read'), controller.get);
router.post('/', requirePermission('vendors:write'), controller.create);
router.put('/:id', requirePermission('vendors:write'), controller.update);
router.delete('/:id', requirePermission('vendors:delete'), controller.remove);

module.exports = router;
