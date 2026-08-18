module.exports = (sequelize, DataTypes) => {
  const PreventiveMaintenance = sequelize.define('PreventiveMaintenance', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    frequencyType: {
      type: DataTypes.ENUM('days', 'weeks', 'months'),
      defaultValue: 'months',
    },
    frequencyValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    leadTimeDays: { type: DataTypes.INTEGER, defaultValue: 0 }, // generate WO this many days before due
    lastGeneratedAt: { type: DataTypes.DATE },
    nextDueDate: { type: DataTypes.DATE, allowNull: false },
    estimatedHours: { type: DataTypes.DECIMAL(8, 2) },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    checklistTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('checklistTemplate');
        try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
      },
      set(val) {
        this.setDataValue('checklistTemplate', JSON.stringify(val || []));
      },
    },
  }, {
    tableName: 'preventive_maintenances',
    timestamps: true,
  });
  return PreventiveMaintenance;
};
