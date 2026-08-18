module.exports = (sequelize, DataTypes) => {
  const Meter = sequelize.define('Meter', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'hours' },
    currentReading: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  }, {
    tableName: 'meters',
    timestamps: true,
  });
  return Meter;
};
