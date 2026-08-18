module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define('WorkOrder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    woNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: {
      type: DataTypes.ENUM('corrective', 'preventive', 'inspection', 'emergency', 'project'),
      defaultValue: 'corrective',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'),
      defaultValue: 'open',
    },
    createdVia: { type: DataTypes.STRING, defaultValue: 'web' }, // web | api | pm_schedule
    dueDate: { type: DataTypes.DATE },
    slaDueAt: { type: DataTypes.DATE },
    startedAt: { type: DataTypes.DATE },
    completedAt: { type: DataTypes.DATE },
    estimatedHours: { type: DataTypes.DECIMAL(8, 2) },
    actualHours: { type: DataTypes.DECIMAL(8, 2) },
    completionNotes: { type: DataTypes.TEXT },
  }, {
    tableName: 'work_orders',
    timestamps: true,
  });
  return WorkOrder;
};
