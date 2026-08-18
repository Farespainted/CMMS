const { Op } = require('sequelize');
const { WorkOrder, Asset, Part, PreventiveMaintenance, DowntimeLog, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

// High-level KPIs for the dashboard.
const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();

  const [
    openWorkOrders, overdueWorkOrders, completedThisMonth, totalAssets,
    downAssets, lowStockParts, upcomingPm, totalWorkOrders,
  ] = await Promise.all([
    WorkOrder.count({ where: { status: { [Op.notIn]: ['completed', 'cancelled'] } } }),
    WorkOrder.count({ where: { status: { [Op.notIn]: ['completed', 'cancelled'] }, dueDate: { [Op.lt]: now } } }),
    WorkOrder.count({ where: { status: 'completed', completedAt: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    Asset.count(),
    Asset.count({ where: { status: 'down' } }),
    Part.count({ where: sequelize.where(sequelize.col('quantity_on_hand'), Op.lte, sequelize.col('reorder_point')) }),
    PreventiveMaintenance.count({ where: { isActive: true, nextDueDate: { [Op.lte]: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } } }),
    WorkOrder.count(),
  ]);

  const byStatus = await WorkOrder.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const byPriority = await WorkOrder.findAll({
    attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: { status: { [Op.notIn]: ['completed', 'cancelled'] } },
    group: ['priority'],
    raw: true,
  });

  return ok(res, {
    openWorkOrders,
    overdueWorkOrders,
    completedThisMonth,
    totalAssets,
    downAssets,
    lowStockParts,
    upcomingPm,
    totalWorkOrders,
    workOrdersByStatus: byStatus,
    openWorkOrdersByPriority: byPriority,
  });
});

// Mean time between failures / mean time to repair style stats per asset (simplified).
const assetReliability = asyncHandler(async (req, res) => {
  const logs = await DowntimeLog.findAll({
    where: { assetId: req.params.assetId, endTime: { [Op.ne]: null } },
    order: [['startTime', 'ASC']],
  });

  if (!logs.length) return ok(res, { assetId: req.params.assetId, incidents: 0, mttrHours: null, mtbfHours: null });

  const durationsHours = logs.map((l) => (new Date(l.endTime) - new Date(l.startTime)) / 3600000);
  const mttrHours = durationsHours.reduce((a, b) => a + b, 0) / durationsHours.length;

  let mtbfHours = null;
  if (logs.length > 1) {
    const gaps = [];
    for (let i = 1; i < logs.length; i++) {
      gaps.push((new Date(logs[i].startTime) - new Date(logs[i - 1].endTime)) / 3600000);
    }
    mtbfHours = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  return ok(res, { assetId: req.params.assetId, incidents: logs.length, mttrHours, mtbfHours });
});

module.exports = { dashboard, assetReliability };
