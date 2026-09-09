const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Invoice',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      invoiceNumber: { type: DataTypes.STRING(30), unique: true, allowNull: false },
      orderId: { type: DataTypes.UUID },
      userId: { type: DataTypes.UUID, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(8), defaultValue: 'USD' },
      status: {
        type: DataTypes.ENUM('draft', 'issued', 'paid', 'refunded', 'cancelled'),
        defaultValue: 'issued',
      },
      issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      paidAt: { type: DataTypes.DATE },
      pdfPath: { type: DataTypes.STRING(500) },
      lineItems: { type: DataTypes.JSONB, defaultValue: [] },
    },
    { tableName: 'invoices', indexes: [{ fields: ['userId'] }, { fields: ['status'] }] },
  );
