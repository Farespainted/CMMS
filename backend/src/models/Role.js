module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING },
    // Array of permission strings, e.g. ["assets:read", "work_orders:write", "*"]
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('permissions');
        try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
      },
      set(val) {
        this.setDataValue('permissions', JSON.stringify(val || []));
      },
    },
  }, {
    tableName: 'roles',
    timestamps: true,
  });
  return Role;
};
