const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'CouponRedemption',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      couponId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID },
      discountApplied: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: 'coupon_redemptions',
      indexes: [
        { fields: ['couponId'] },
        { fields: ['userId'] },
        { unique: true, fields: ['couponId', 'userId'] },
      ],
    },
  );
