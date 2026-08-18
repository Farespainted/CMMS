module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    poNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'received', 'cancelled'),
      defaultValue: 'draft',
    },
    orderDate: { type: DataTypes.DATEONLY },
    expectedDate: { type: DataTypes.DATEONLY },
    receivedDate: { type: DataTypes.DATEONLY },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT },
  }, {
    tableName: 'purchase_orders',
    timestamps: true,
  });
  return PurchaseOrder;
};
