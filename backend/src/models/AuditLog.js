module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorType: { type: DataTypes.ENUM('user', 'api_key', 'system'), defaultValue: 'user' },
    actorLabel: { type: DataTypes.STRING }, // denormalized name/email/key name for easy display
    action: { type: DataTypes.STRING, allowNull: false }, // e.g. create, update, delete, login
    entityType: { type: DataTypes.STRING, allowNull: false }, // e.g. Asset, WorkOrder
    entityId: { type: DataTypes.STRING },
    changes: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('changes');
        try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
      },
      set(val) {
        this.setDataValue('changes', val ? JSON.stringify(val) : null);
      },
    },
    ipAddress: { type: DataTypes.STRING },
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  });
  return AuditLog;
};
