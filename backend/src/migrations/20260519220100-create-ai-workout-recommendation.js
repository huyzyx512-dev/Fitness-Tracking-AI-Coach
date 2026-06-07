'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_workout_recommendation', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      goal: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Mục tiêu người dùng nhập, ví dụ: giảm mỡ, tăng cơ',
      },
      days_per_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số buổi/tuần người dùng có thể tập',
      },
      session_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số phút mỗi buổi tập',
      },
      level: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Trình độ: beginner, intermediate, advanced',
      },
      equipment: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Danh sách thiết bị sẵn có (mảng string)',
      },
      generated_plan: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Kế hoạch tập do AI tạo ra (mảng ngày/bài tập)',
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Trạng thái: draft, applied, dismissed',
      },
      applied_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời điểm người dùng apply recommendation này',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('ai_workout_recommendation', ['user_id'], {
      name: 'idx_ai_workout_rec_user_id',
    });
    await queryInterface.addIndex('ai_workout_recommendation', ['status'], {
      name: 'idx_ai_workout_rec_status',
    });
    await queryInterface.addIndex('ai_workout_recommendation', ['createdAt'], {
      name: 'idx_ai_workout_rec_created_at',
    });
    await queryInterface.addIndex('ai_workout_recommendation', ['user_id', 'status'], {
      name: 'idx_ai_workout_rec_user_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_workout_recommendation');
  },
};
