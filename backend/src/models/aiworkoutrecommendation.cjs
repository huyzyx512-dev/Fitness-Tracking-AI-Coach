'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AiWorkoutRecommendation extends Model {
    static associate(models) {
      AiWorkoutRecommendation.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }
  AiWorkoutRecommendation.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    goal: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Mục tiêu người dùng nhập',
    },
    days_per_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    level: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Trình độ: beginner, intermediate, advanced',
    },
    equipment: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Danh sách thiết bị sẵn có (mảng string)',
    },
    generated_plan: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Kế hoạch tập do AI tạo ra',
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'draft',
      comment: 'Trạng thái: draft, applied, dismissed',
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'AiWorkoutRecommendation',
    tableName: 'ai_workout_recommendation',
    freezeTableName: true,
  });
  return AiWorkoutRecommendation;
};
