const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Coupon',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
      discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2) },
      minOrderAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      maxTotalUsage: { type: DataTypes.INTEGER },
      usesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      applicableTo: {
        type: DataTypes.ENUM('all', 'first_order', 'specific_users'),
        defaultValue: 'all',
      },
      couponType: { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
      startDate: { type: DataTypes.DATE },
      expiryDate: { type: DataTypes.DATE },
      status: { type: DataTypes.ENUM('active', 'inactive', 'expired'), defaultValue: 'active' },
    },
    { tableName: 'coupons', indexes: [{ fields: ['code'] }, { fields: ['status'] }] },
  );
