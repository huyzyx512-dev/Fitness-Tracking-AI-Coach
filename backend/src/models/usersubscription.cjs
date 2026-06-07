'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSubscription extends Model {
    static associate(models) {
      UserSubscription.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      UserSubscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
        as: 'plan',
      });
      UserSubscription.belongsTo(models.PaymentOrder, {
        foreignKey: 'source_payment_order_id',
        as: 'sourceOrder',
      });
    }
  }

  UserSubscription.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      plan_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
      started_at: { type: DataTypes.DATE, allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      source_payment_order_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'UserSubscription',
      tableName: 'user_subscription',
      freezeTableName: true,
    },
  );

  return UserSubscription;
};
