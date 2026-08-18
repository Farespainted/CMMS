module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('Webhook', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    secret: { type: DataTypes.STRING }, // used to sign payloads (HMAC-SHA256)
    events: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('events');
        try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
      },
      set(val) {
        this.setDataValue('events', JSON.stringify(val || []));
      },
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastTriggeredAt: { type: DataTypes.DATE },
    lastStatus: { type: DataTypes.STRING },
  }, {
    tableName: 'webhooks',
    timestamps: true,
  });
  return Webhook;
};
