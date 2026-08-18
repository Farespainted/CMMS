const express = require('express');
const controller = require('../controllers/apiKeyController');
const { authenticate, requirePermission, requireUser } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireUser);

router.get('/', requirePermission('api_keys:read'), controller.list);
router.get('/permission-catalog', requirePermission('api_keys:read'), controller.listPermissionCatalog);
router.post('/', requirePermission('api_keys:write'), controller.create);
router.put('/:id', requirePermission('api_keys:write'), controller.update);
router.delete('/:id', requirePermission('api_keys:delete'), controller.remove);

module.exports = router;
