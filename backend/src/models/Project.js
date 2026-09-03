const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Project',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      ownerId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT },
      status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
    },
    { tableName: 'projects', indexes: [{ fields: ['ownerId'] }] },
  );
