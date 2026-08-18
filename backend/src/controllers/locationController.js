const { Location } = require('../models');
const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(Location, {
  entityType: 'Location',
  searchFields: ['name', 'code', 'address'],
  filterFields: ['parentId'],
  include: [{ association: 'parent' }, { association: 'children' }],
  defaultOrder: [['name', 'ASC']],
});
