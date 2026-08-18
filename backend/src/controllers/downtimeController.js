const { DowntimeLog, Asset, WorkOrder } = require('../models');
const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(DowntimeLog, {
  entityType: 'DowntimeLog',
  filterFields: ['assetId', 'category', 'workOrderId'],
  include: [{ model: Asset }, { model: WorkOrder, attributes: ['id', 'woNumber', 'title'] }],
  defaultOrder: [['startTime', 'DESC']],
});
