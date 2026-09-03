const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'ProjectMember',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID },
      email: { type: DataTypes.STRING(255), allowNull: false },
      inviteToken: { type: DataTypes.STRING(120), unique: true },
      status: {
        type: DataTypes.ENUM('invited', 'accepted', 'declined', 'removed'),
        defaultValue: 'invited',
      },
      role: { type: DataTypes.ENUM('owner', 'editor', 'viewer'), defaultValue: 'editor' },
      invitedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      acceptedAt: { type: DataTypes.DATE },
    },
    { tableName: 'project_members', indexes: [{ fields: ['projectId'] }, { fields: ['userId'] }] },
  );
