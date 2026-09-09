const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Order',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderNumber: { type: DataTypes.STRING(30), unique: true, allowNull: false },
      buyerId: { type: DataTypes.UUID, allowNull: false },
      listingId: { type: DataTypes.UUID, allowNull: false },
      orderType: { type: DataTypes.ENUM('guest_post', 'link_insert'), allowNull: false },
      targetSite: { type: DataTypes.STRING(255) },
      orderedSite: { type: DataTypes.STRING(255) },
      anchorText: { type: DataTypes.STRING(255) },
      landingPage: { type: DataTypes.STRING(500) },
      articleDocLink: { type: DataTypes.STRING(500) },
      contentRequirements: { type: DataTypes.TEXT },
      additionalDetails: { type: DataTypes.JSONB, defaultValue: {} },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      sensitiveNiche: { type: DataTypes.BOOLEAN, defaultValue: false },
      paymentMethod: { type: DataTypes.ENUM('wallet', 'payoneer', 'sslcommerz', 'stripe') },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
        defaultValue: 'pending',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'in_progress', 'delivered', 'rejected', 'cancelled'),
        defaultValue: 'pending',
      },
      liveLink: { type: DataTypes.STRING(500) },
      deliveredAt: { type: DataTypes.DATE },
      cancelledAt: { type: DataTypes.DATE },
      couponCode: { type: DataTypes.STRING(50) },
      discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    },
    {
      tableName: 'orders',
      indexes: [
        { fields: ['buyerId'] },
        { fields: ['listingId'] },
        { fields: ['status'] },
        { fields: ['paymentStatus'] },
      ],
    },
  );
