module.exports = (sequelize, DataTypes) => {
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: {
      type: DataTypes.ENUM('receive', 'issue', 'adjust', 'return'),
      allowNull: false,
    },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    notes: { type: DataTypes.STRING },
  }, {
    tableName: 'inventory_transactions',
    timestamps: true,
  });
  return InventoryTransaction;
};
