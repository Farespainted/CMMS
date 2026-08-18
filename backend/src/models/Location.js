module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
  }, {
    tableName: 'locations',
    timestamps: true,
  });
  return Location;
};
