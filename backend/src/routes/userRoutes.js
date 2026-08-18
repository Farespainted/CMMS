const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, requirePermission, requireUser } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireUser);

router.get('/', requirePermission('users:read'), userController.list);
router.get('/roles', requirePermission('roles:read'), userController.listRoles);
router.get('/:id', requirePermission('users:read'), userController.get);
router.put('/:id', requirePermission('users:write'), userController.update);
router.delete('/:id', requirePermission('users:delete'), userController.remove);

module.exports = router;
