const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/locations', require('./locationRoutes'));
router.use('/assets', require('./assetRoutes'));
router.use('/work-orders', require('./workOrderRoutes'));
router.use('/preventive-maintenance', require('./pmRoutes'));
router.use('/parts', require('./partRoutes'));
router.use('/vendors', require('./vendorRoutes'));
router.use('/purchase-orders', require('./purchaseOrderRoutes'));
router.use('/meters', require('./meterRoutes'));
router.use('/downtime-logs', require('./downtimeRoutes'));
router.use('/api-keys', require('./apiKeyRoutes'));
router.use('/webhooks', require('./webhookRoutes'));
router.use('/audit-logs', require('./auditLogRoutes'));
router.use('/reports', require('./reportRoutes'));

module.exports = router;
