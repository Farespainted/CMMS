const { Vendor } = require('../models');
const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(Vendor, {
  entityType: 'Vendor',
  searchFields: ['name', 'contactName', 'email'],
  filterFields: ['category'],
  defaultOrder: [['name', 'ASC']],
});
