'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminAuditLog extends Model {
    static associate(models) {
      AdminAuditLog.belongsTo(models.User, {
        foreignKey: 'actor_user_id',
        as: 'actor',
      });
      AdminAuditLog.belongsTo(models.User, {
        foreignKey: 'target_user_id',
        as: 'targetUser',
      });
    }
  }

  AdminAuditLog.init(
    {
      actor_user_id: { type: DataTypes.INTEGER, allowNull: false },
      target_user_id: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING(64), allowNull: false },
      metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
      ip_address: DataTypes.STRING(45),
      user_agent: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'AdminAuditLog',
      tableName: 'admin_audit_log',
      freezeTableName: true,
      timestamps: true,
      updatedAt: false,
    },
  );

  return AdminAuditLog;
};
