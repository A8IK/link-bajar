const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'WishlistItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      listingId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: 'wishlist_items',
      indexes: [
        { fields: ['userId'] },
        { unique: true, fields: ['userId', 'listingId'] },
      ],
    },
  );
