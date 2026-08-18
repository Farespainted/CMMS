const crypto = require('crypto');

function sign(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// Fans an event out to every active webhook subscribed to it (or to "*").
// Fire-and-forget from callers' perspective; failures are logged, not thrown.
async function dispatchWebhookEvent(eventName, payload) {
  const { Webhook } = require('../models');
  const webhooks = await Webhook.findAll({ where: { isActive: true } });
  const subscribed = webhooks.filter((w) => w.events.includes(eventName) || w.events.includes('*'));

  await Promise.all(subscribed.map(async (webhook) => {
    const body = JSON.stringify({ event: eventName, data: payload, timestamp: new Date().toISOString() });
    const headers = { 'Content-Type': 'application/json' };
    if (webhook.secret) headers['X-CMMS-Signature'] = sign(webhook.secret, body);

    try {
      const response = await fetch(webhook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
      webhook.lastTriggeredAt = new Date();
      webhook.lastStatus = String(response.status);
      await webhook.save();
    } catch (err) {
      webhook.lastTriggeredAt = new Date();
      webhook.lastStatus = `error: ${err.message}`;
      await webhook.save();
    }
  }));
}

module.exports = { dispatchWebhookEvent };
