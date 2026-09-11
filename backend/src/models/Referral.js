const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Referral',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referrerId: { type: DataTypes.UUID, allowNull: false },
      referredUserId: { type: DataTypes.UUID, allowNull: false },
      referralCode: { type: DataTypes.STRING(20), allowNull: false },
      discountType: { type: DataTypes.ENUM('percentage', 'fixed', 'wallet') },
      discountValue: { type: DataTypes.DECIMAL(10, 2) },
      maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2) },
      minOrderAmount: { type: DataTypes.DECIMAL(10, 2) },
      applicableTo: { type: DataTypes.ENUM('all', 'referral', 'specific_buyer'), defaultValue: 'referral' },
      isFirstOrderOnly: { type: DataTypes.BOOLEAN, defaultValue: true },
      expiryDays: { type: DataTypes.INTEGER, defaultValue: 7 },
      bonusEarned: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      status: { type: DataTypes.ENUM('active', 'inactive', 'expired'), defaultValue: 'active' },
    },
    {
      tableName: 'referrals',
      indexes: [{ fields: ['referrerId'] }, { fields: ['referredUserId'] }],
    },
  );
