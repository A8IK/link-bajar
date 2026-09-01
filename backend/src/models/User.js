const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      publicId: { type: DataTypes.STRING(16), unique: true, allowNull: false },
      email: { type: DataTypes.STRING(255), unique: true, allowNull: false, validate: { isEmail: true } },
      emailVerifiedAt: { type: DataTypes.DATE },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      firstName: { type: DataTypes.STRING(100) },
      lastName: { type: DataTypes.STRING(100) },
      phone: { type: DataTypes.STRING(30) },
      role: {
        type: DataTypes.ENUM('admin', 'buyer', 'seller', 'agency', 'partnership'),
        defaultValue: 'buyer',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'blocked', 'pending_verification'),
        defaultValue: 'active',
        allowNull: false,
      },
      company: { type: DataTypes.STRING(150) },
      country: { type: DataTypes.STRING(80) },
      state: { type: DataTypes.STRING(80) },
      city: { type: DataTypes.STRING(80) },
      postalCode: { type: DataTypes.STRING(20) },
      profileCountry: { type: DataTypes.STRING(80) },
      registrationIp: { type: DataTypes.STRING(45) },
      registrationLocation: { type: DataTypes.STRING(150) },
      referralCode: { type: DataTypes.STRING(20), unique: true },
      referredByCode: { type: DataTypes.STRING(20) },
      lastLoginAt: { type: DataTypes.DATE },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    {
      tableName: 'users',
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['status'] },
        { fields: ['referralCode'] },
      ],
    },
  );
