const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Transaction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID },
      type: {
        type: DataTypes.ENUM(
          'deposit',
          'withdrawal',
          'order_payment',
          'order_earning',
          'refund',
          'referral_bonus',
          'admin_adjustment',
        ),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(8), defaultValue: 'USD' },
      method: { type: DataTypes.ENUM('wallet', 'payoneer', 'sslcommerz', 'stripe', 'manual') },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
      },
      gatewayTransactionId: { type: DataTypes.STRING(255) },
      reference: { type: DataTypes.STRING(255) },
      notes: { type: DataTypes.TEXT },
      meta: { type: DataTypes.JSONB, defaultValue: {} },
    },
    {
      tableName: 'transactions',
      indexes: [
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['status'] },
      ],
    },
  );
