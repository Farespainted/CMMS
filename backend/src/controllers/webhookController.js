const crypto = require('crypto');
const { Webhook } = require('../models');
const crudFactory = require('../utils/crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');
const { dispatchWebhookEvent } = require('../services/webhookDispatcher');

const base = crudFactory(Webhook, {
  entityType: 'Webhook',
  searchFields: ['name', 'url'],
  defaultOrder: [['createdAt', 'DESC']],
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.secret) body.secret = crypto.randomBytes(16).toString('hex');
  if (req.auth.type === 'user') body.createdById = req.auth.user.id;
  req.body = body;
  return base.create(req, res);
});

const test = asyncHandler(async (req, res) => {
  const webhook = await Webhook.findByPk(req.params.id);
  if (!webhook) return fail(res, 404, 'Webhook not found');
  await dispatchWebhookEvent('webhook.test', { message: 'This is a test event from your CMMS instance.' });
  return ok(res, { sent: true });
});

const AVAILABLE_EVENTS = [
  'work_order.created',
  'work_order.status_changed',
  'work_order.completed',
  'asset.status_changed',
  'part.low_stock',
  '*',
];

const listEvents = asyncHandler(async (req, res) => ok(res, AVAILABLE_EVENTS));

module.exports = { ...base, create, test, listEvents };
