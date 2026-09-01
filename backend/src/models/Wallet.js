const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Wallet',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      availableBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      pendingBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      bonusBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      referralBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      currency: { type: DataTypes.STRING(8), defaultValue: 'USD', allowNull: false },
    },
    { tableName: 'wallets' },
  );
