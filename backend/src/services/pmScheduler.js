const cron = require('node-cron');
const { Op } = require('sequelize');
const { generateCode } = require('../utils/idGen');

function addFrequency(date, type, value) {
  const d = new Date(date);
  if (type === 'days') d.setDate(d.getDate() + value);
  else if (type === 'weeks') d.setDate(d.getDate() + value * 7);
  else d.setMonth(d.getMonth() + value); // 'months' (default)
  return d;
}

// Creates a work order from a PM schedule, advances the schedule's next due
// date by one frequency interval, and records lastGeneratedAt.
// { force: true } bypasses the due-date window check (used by the "Generate now" button).
async function generateWorkOrderFromPM(pmInstance, { force = false } = {}) {
  const { WorkOrder, WorkOrderTask, PreventiveMaintenance } = require('../models');
  const { dispatchWebhookEvent } = require('./webhookDispatcher');

  const pm = pmInstance instanceof PreventiveMaintenance
    ? pmInstance
    : await PreventiveMaintenance.findByPk(pmInstance.id);

  if (!force) {
    const leadMs = (pm.leadTimeDays || 0) * 24 * 60 * 60 * 1000;
    const triggerAt = new Date(new Date(pm.nextDueDate).getTime() - leadMs);
    if (new Date() < triggerAt) {
      return null; // not due yet
    }
  }

  const wo = await WorkOrder.create({
    woNumber: generateCode('WO'),
    title: `PM: ${pm.name}`,
    description: pm.description,
    type: 'preventive',
    priority: pm.priority || 'medium',
    status: pm.assignedToId ? 'assigned' : 'open',
    assetId: pm.assetId,
    assignedToId: pm.assignedToId,
    estimatedHours: pm.estimatedHours,
    dueDate: pm.nextDueDate,
    createdVia: 'pm_schedule',
    pmScheduleId: pm.id,
  });

  const checklist = pm.checklistTemplate || [];
  if (checklist.length) {
    await WorkOrderTask.bulkCreate(
      checklist.map((desc, i) => ({ workOrderId: wo.id, description: desc, sortOrder: i }))
    );
  }

  pm.lastGeneratedAt = new Date();
  pm.nextDueDate = addFrequency(pm.nextDueDate, pm.frequencyType, pm.frequencyValue);
  await pm.save();

  dispatchWebhookEvent('work_order.created', { ...wo.toJSON(), source: 'pm_schedule' }).catch(() => {});

  return wo;
}

// Scans all active PM schedules and generates work orders for any that are due
// (within their lead time window). Safe to call repeatedly - schedules that
// already had a work order generated for the current cycle simply won't be due again.
async function runDuePmSchedules() {
  const { PreventiveMaintenance } = require('../models');
  const now = new Date();
  const schedules = await PreventiveMaintenance.findAll({
    where: {
      isActive: true,
      nextDueDate: { [Op.lte]: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) }, // fetch candidates, filter precisely below
    },
  });

  const generated = [];
  for (const pm of schedules) {
    const wo = await generateWorkOrderFromPM(pm, { force: false });
    if (wo) generated.push(wo);
  }
  return generated;
}

// Schedules the daily due-check. Call once at server startup.
function startPmScheduler() {
  // Run once shortly after boot to catch anything due, then daily at 01:00 server time.
  setTimeout(() => {
    runDuePmSchedules().catch((err) => console.error('PM scheduler startup run failed:', err.message));
  }, 5000);

  cron.schedule('0 1 * * *', () => {
    runDuePmSchedules().catch((err) => console.error('PM scheduler daily run failed:', err.message));
  });
}

module.exports = { generateWorkOrderFromPM, runDuePmSchedules, startPmScheduler, addFrequency };
