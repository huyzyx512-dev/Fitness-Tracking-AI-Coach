'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('exercise', 'category_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'category', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }, { transaction });

      const [exercises] = await queryInterface.sequelize.query(
        `SELECT DISTINCT category FROM exercise WHERE category IS NOT NULL`,
        { transaction }
      );

      for (const row of exercises) {
        if (!row.category) continue;
        const now = new Date();
        await queryInterface.sequelize.query(
          `INSERT INTO category (name, createdAt, updatedAt) VALUES (?, ?, ?)`,
          {
            replacements: [row.category, now, now],
            transaction
          }
        );
        await queryInterface.sequelize.query(
          `UPDATE exercise SET category_id = (SELECT id FROM category WHERE name = ? LIMIT 1) WHERE category = ?`,
          { replacements: [row.category, row.category], transaction }
        );
      }

      const [muscleRows] = await queryInterface.sequelize.query(
        `SELECT DISTINCT muscle_group FROM exercise WHERE muscle_group IS NOT NULL`,
        { transaction }
      );

      for (const row of muscleRows) {
        if (!row.muscle_group) continue;
        const now = new Date();
        await queryInterface.sequelize.query(
          `INSERT INTO muscle_group (name, createdAt, updatedAt) VALUES (?, ?, ?)`,
          { replacements: [row.muscle_group, now, now], transaction }
        );
      }

      await queryInterface.createTable('exercise_muscle', {
        exercise_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: { model: 'exercise', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        muscle_group_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: { model: 'muscle_group', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Primary muscle marker'
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction });

      const [exWithMuscle] = await queryInterface.sequelize.query(
        `SELECT id, muscle_group FROM exercise WHERE muscle_group IS NOT NULL`,
        { transaction }
      );

      for (const ex of exWithMuscle) {
        const now = new Date();
        await queryInterface.sequelize.query(
          `INSERT INTO exercise_muscle (exercise_id, muscle_group_id, is_primary, createdAt, updatedAt)
           SELECT ?, mg.id, true, ?, ?
           FROM muscle_group mg WHERE mg.name = ? LIMIT 1`,
          { replacements: [ex.id, now, now, ex.muscle_group], transaction }
        );
      }

      await queryInterface.removeColumn('exercise', 'muscle_group', { transaction });
      await queryInterface.removeColumn('exercise', 'category', { transaction });
      await queryInterface.removeColumn('exercise', 'met_value', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('exercise', 'muscle_group', {
        type: Sequelize.STRING
      }, { transaction });

      await queryInterface.addColumn('exercise', 'category', {
        type: Sequelize.STRING
      }, { transaction });

      await queryInterface.addColumn('exercise', 'met_value', {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 3.0
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE exercise e
        JOIN Exercise_muscle em ON em.exercise_id = e.id AND em.is_primary = true
        JOIN muscle_group mg ON mg.id = em.muscle_group_id
        SET e.muscle_group = mg.name
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE exercise e
        JOIN Category c ON c.id = e.category_id
        SET e.category = c.name
      `, { transaction });

      await queryInterface.dropTable('exercise_muscle', { transaction });
      await queryInterface.removeColumn('exercise', 'category_id', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
