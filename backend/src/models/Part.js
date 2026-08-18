module.exports = (sequelize, DataTypes) => {
  const Part = sequelize.define('Part', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    partNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    unitOfMeasure: { type: DataTypes.STRING, defaultValue: 'each' },
    quantityOnHand: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    reorderPoint: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    reorderQuantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    unitCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    binLocation: { type: DataTypes.STRING },
  }, {
    tableName: 'parts',
    timestamps: true,
  });
  return Part;
};
