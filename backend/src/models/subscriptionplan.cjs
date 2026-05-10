'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.PaymentOrder, {
        foreignKey: 'plan_id',
        as: 'paymentOrders',
      });
      SubscriptionPlan.hasMany(models.UserSubscription, {
        foreignKey: 'plan_id',
        as: 'userSubscriptions',
      });
    }
  }

  SubscriptionPlan.init(
    {
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VND' },
      duration_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
      features: { type: DataTypes.JSON, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'SubscriptionPlan',
      tableName: 'subscription_plan',
      freezeTableName: true,
    },
  );

  return SubscriptionPlan;
};
