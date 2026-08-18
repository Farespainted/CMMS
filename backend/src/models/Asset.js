module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    assetTag: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    manufacturer: { type: DataTypes.STRING },
    modelNumber: { type: DataTypes.STRING },
    serialNumber: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM('operational', 'down', 'maintenance', 'retired'),
      defaultValue: 'operational',
    },
    criticality: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    purchaseDate: { type: DataTypes.DATEONLY },
    purchaseCost: { type: DataTypes.DECIMAL(12, 2) },
    warrantyExpiry: { type: DataTypes.DATEONLY },
    installDate: { type: DataTypes.DATEONLY },
  }, {
    tableName: 'assets',
    timestamps: true,
  });
  return Asset;
};
