'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AiRequestLog extends Model {
    static associate(models) {
      AiRequestLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }
  AiRequestLog.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Loại request: ask, workout_plan',
    },
    input: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    output: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'Trạng thái: success, failed',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    input_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    output_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'AiRequestLog',
    tableName: 'ai_request_log',
    freezeTableName: true,
  });
  return AiRequestLog;
};
