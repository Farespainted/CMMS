module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    contactName: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    category: {
      type: DataTypes.ENUM('supplier', 'contractor', 'both'),
      defaultValue: 'supplier',
    },
    notes: { type: DataTypes.TEXT },
  }, {
    tableName: 'vendors',
    timestamps: true,
  });
  return Vendor;
};
