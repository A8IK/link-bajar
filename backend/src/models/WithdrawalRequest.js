const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'WithdrawalRequest',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      requestedMethod: { type: DataTypes.ENUM('payoneer', 'sslcommerz', 'bank'), allowNull: false },
      paymentAddress: { type: DataTypes.STRING(255) },
      bankAccountId: { type: DataTypes.UUID },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing', 'completed'),
        defaultValue: 'pending',
      },
      adminNote: { type: DataTypes.TEXT },
      processedAt: { type: DataTypes.DATE },
    },
    { tableName: 'withdrawal_requests', indexes: [{ fields: ['userId'] }, { fields: ['status'] }] },
  );
