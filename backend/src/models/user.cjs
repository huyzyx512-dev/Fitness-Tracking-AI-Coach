'use strict';
const { Model, DataTypes: SequelizeDataTypes } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });

      User.hasMany(models.Workout, {
        foreignKey: 'user_id',
        as: 'workouts'
      });

      User.hasMany(models.Exercise, {
        foreignKey: 'created_by',
        as: 'createdExercises'
      });

      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        as: 'refreshTokens'
      });

      User.hasMany(models.AdminAuditLog, {
        foreignKey: 'actor_user_id',
        as: 'adminAuditLogsAsActor',
      });
      User.hasMany(models.AdminAuditLog, {
        foreignKey: 'target_user_id',
        as: 'adminAuditLogsAsTarget',
      });

      User.hasMany(models.PaymentOrder, {
        foreignKey: 'user_id',
        as: 'paymentOrders',
      });
      User.hasMany(models.UserSubscription, {
        foreignKey: 'user_id',
        as: 'subscriptions',
      });
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password_hash: DataTypes.STRING,
    name: DataTypes.STRING,
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    role_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 70.00
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 170.00
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      defaultValue: 'male'
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    /** Cache field — source of truth is user_subscription. Used by entitlement middleware for fast checks. */
    subscription_tier: {
      type: DataTypes.STRING(32),
      defaultValue: 'FREE',
      allowNull: false
    },
    /** Cache field — source of truth is user_subscription.expires_at. Null = no paid plan. */
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    freezeTableName: true // Ngăn sequalize tự đổi tên
  });
  return User;
};