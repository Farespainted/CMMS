const express = require('express');
const controller = require('../controllers/locationController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('locations:read'), controller.list);
router.get('/:id', requirePermission('locations:read'), controller.get);
router.post('/', requirePermission('locations:write'), controller.create);
router.put('/:id', requirePermission('locations:write'), controller.update);
router.delete('/:id', requirePermission('locations:delete'), controller.remove);

module.exports = router;
