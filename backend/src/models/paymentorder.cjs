'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentOrder extends Model {
    static associate(models) {
      PaymentOrder.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      PaymentOrder.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
        as: 'plan',
      });
      PaymentOrder.hasMany(models.PaymentTransaction, {
        foreignKey: 'payment_order_id',
        as: 'transactions',
      });
      PaymentOrder.hasMany(models.UserSubscription, {
        foreignKey: 'source_payment_order_id',
        as: 'subscriptions',
      });
    }
  }

  PaymentOrder.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      plan_id: { type: DataTypes.INTEGER, allowNull: false },
      provider: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'sepay' },
      order_code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VND' },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'expired', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      payment_content: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      qr_url: { type: DataTypes.TEXT, allowNull: true },
      payment_url: { type: DataTypes.TEXT, allowNull: true },
      bank_account: { type: DataTypes.STRING(64), allowNull: true },
      bank_name: { type: DataTypes.STRING(120), allowNull: true },
      account_name: { type: DataTypes.STRING(120), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      raw_provider_data: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: 'PaymentOrder',
      tableName: 'payment_order',
      freezeTableName: true,
    },
  );

  return PaymentOrder;
};
