const express = require('express');
const controller = require('../controllers/webhookController');
const { authenticate, requirePermission, requireUser } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireUser);

router.get('/', requirePermission('webhooks:read'), controller.list);
router.get('/events', requirePermission('webhooks:read'), controller.listEvents);
router.get('/:id', requirePermission('webhooks:read'), controller.get);
router.post('/', requirePermission('webhooks:write'), controller.create);
router.put('/:id', requirePermission('webhooks:write'), controller.update);
router.delete('/:id', requirePermission('webhooks:delete'), controller.remove);
router.post('/:id/test', requirePermission('webhooks:write'), controller.test);

module.exports = router;
