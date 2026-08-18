module.exports = (sequelize, DataTypes) => {
  const DowntimeLog = sequelize.define('DowntimeLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE },
    reason: { type: DataTypes.STRING },
    category: {
      type: DataTypes.ENUM('planned', 'unplanned'),
      defaultValue: 'unplanned',
    },
    notes: { type: DataTypes.TEXT },
  }, {
    tableName: 'downtime_logs',
    timestamps: true,
  });
  return DowntimeLog;
};
