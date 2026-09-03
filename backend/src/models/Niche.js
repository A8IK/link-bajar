const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Niche',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
      slug: { type: DataTypes.STRING(120), unique: true, allowNull: false },
      isSensitive: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdById: { type: DataTypes.UUID },
    },
    { tableName: 'niches' },
  );
