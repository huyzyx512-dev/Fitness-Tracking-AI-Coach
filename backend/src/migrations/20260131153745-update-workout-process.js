'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Thêm cột vào bảng 'workout'
      await queryInterface.addColumn('workout', 'started_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian thực tế bắt đầu'
      }, { transaction });

      await queryInterface.addColumn('workout', 'ended_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian thực tế kết thúc'
      }, { transaction });

      // 2. Thêm cột vào bảng 'workoutexercise'
      await queryInterface.addColumn('workout_exercise', 'order_index', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Thứ tự bài tập trong buổi'
      }, { transaction });

      await queryInterface.addColumn('workout_exercise', 'rest_time_seconds', {
        type: Sequelize.INTEGER,
        defaultValue: 60,
        comment: 'Thời gian nghỉ giữa các set (giây)'
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('workout', 'started_at', { transaction });
      await queryInterface.removeColumn('workout', 'ended_at', { transaction });
      await queryInterface.removeColumn('workout_exercise', 'order_index', { transaction });
      await queryInterface.removeColumn('workout_exercise', 'rest_time_seconds', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};