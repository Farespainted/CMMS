const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, requirePermission, requireUser } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, requireUser, authController.changePassword);
router.post('/users', authenticate, requireUser, requirePermission('users:write'), authController.createUser);

module.exports = router;
