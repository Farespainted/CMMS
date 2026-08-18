module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE },
  }, {
    tableName: 'users',
    timestamps: true,
  });
  return User;
};
