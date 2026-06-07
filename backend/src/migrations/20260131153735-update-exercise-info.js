'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('exercise', 'met_value', {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 3.0,
        comment: 'Chỉ số MET để tính calories'
      }, { transaction });

      await queryInterface.addColumn('exercise', 'difficulty_level', {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner'
      }, { transaction });

      await queryInterface.addColumn('exercise', 'equipment', {
        type: Sequelize.STRING,
        defaultValue: 'none',
        comment: 'Dụng cụ: dumbbell, barbell...'
      }, { transaction });

      await queryInterface.addColumn('exercise', 'video_url', {
        type: Sequelize.STRING(500),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('exercise', 'thumbnail_url', {
        type: Sequelize.STRING(500),
        allowNull: true
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
      await queryInterface.removeColumn('exercise', 'met_value', { transaction });
      await queryInterface.removeColumn('exercise', 'difficulty_level', { transaction });
      await queryInterface.removeColumn('exercise', 'equipment', { transaction });
      await queryInterface.removeColumn('exercise', 'video_url', { transaction });
      await queryInterface.removeColumn('exercise', 'thumbnail_url', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};