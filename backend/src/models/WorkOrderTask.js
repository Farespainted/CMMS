module.exports = (sequelize, DataTypes) => {
  const WorkOrderTask = sequelize.define('WorkOrderTask', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    description: { type: DataTypes.STRING, allowNull: false },
    isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    completedAt: { type: DataTypes.DATE },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'work_order_tasks',
    timestamps: true,
  });
  return WorkOrderTask;
};
