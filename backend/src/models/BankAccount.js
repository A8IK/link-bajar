const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'BankAccount',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      label: { type: DataTypes.STRING(80) },
      accountHolder: { type: DataTypes.STRING(150), allowNull: false },
      bankName: { type: DataTypes.STRING(150) },
      accountNumber: { type: DataTypes.STRING(60), allowNull: false },
      routingNumber: { type: DataTypes.STRING(40) },
      swiftCode: { type: DataTypes.STRING(40) },
      country: { type: DataTypes.STRING(80) },
      method: { type: DataTypes.ENUM('bank', 'payoneer', 'sslcommerz'), defaultValue: 'bank' },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'bank_accounts', indexes: [{ fields: ['userId'] }] },
  );
