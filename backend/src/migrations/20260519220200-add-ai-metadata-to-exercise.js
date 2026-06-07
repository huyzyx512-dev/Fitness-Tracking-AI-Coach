'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('exercise', 'normalized_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Tên chuẩn hóa (lowercase+trim) phục vụ matching/reuse bài tập AI',
      }, { transaction });

      await queryInterface.addColumn('exercise', 'source_type', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'system',
        comment: 'Nguồn gốc: system, ai_generated',
      }, { transaction });

      await queryInterface.addColumn('exercise', 'is_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Bài tập đã được xác minh (mặc định true cho dữ liệu hệ thống)',
      }, { transaction });

      // Backfill normalized_name cho exercise hiện có bằng 1 câu SQL, không loop từng row
      await queryInterface.sequelize.query(
        `UPDATE exercise SET normalized_name = LOWER(TRIM(name)) WHERE normalized_name IS NULL`,
        { transaction },
      );

      await queryInterface.addIndex('exercise', ['normalized_name'], {
        name: 'idx_exercise_normalized_name',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('exercise', 'idx_exercise_normalized_name', { transaction });
      await queryInterface.removeColumn('exercise', 'is_verified', { transaction });
      await queryInterface.removeColumn('exercise', 'source_type', { transaction });
      await queryInterface.removeColumn('exercise', 'normalized_name', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
