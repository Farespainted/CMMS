module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    description: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 1 },
    unitCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    quantityReceived: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  }, {
    tableName: 'purchase_order_items',
    timestamps: true,
  });
  return PurchaseOrderItem;
};
