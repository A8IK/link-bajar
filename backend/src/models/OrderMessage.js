const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'OrderMessage',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      senderId: { type: DataTypes.UUID, allowNull: false },
      senderRole: { type: DataTypes.ENUM('admin', 'buyer', 'seller'), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      attachmentUrl: { type: DataTypes.STRING(500) },
      readAt: { type: DataTypes.DATE },
    },
    {
      tableName: 'order_messages',
      indexes: [{ fields: ['orderId'] }],
    },
  );
