module.exports = (sequelize, DataTypes) => {
  const MeterReading = sequelize.define('MeterReading', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    reading: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.STRING },
  }, {
    tableName: 'meter_readings',
    timestamps: true,
  });
  return MeterReading;
};
