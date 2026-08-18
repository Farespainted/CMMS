module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    keyPrefix: { type: DataTypes.STRING, allowNull: false }, // shown to user for identification
    keyHash: { type: DataTypes.STRING, allowNull: false }, // sha256 hash of the full secret
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
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastUsedAt: { type: DataTypes.DATE },
    expiresAt: { type: DataTypes.DATE },
  }, {
    tableName: 'api_keys',
    timestamps: true,
  });
  return ApiKey;
};
