'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_audit_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      actor_user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      target_user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      action: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      metadata: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      ip_address: {
        allowNull: true,
        type: Sequelize.STRING(45),
      },
      user_agent: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('admin_audit_log', ['target_user_id', 'createdAt'], {
      name: 'admin_audit_log_target_created_idx',
    });
    await queryInterface.addIndex('admin_audit_log', ['actor_user_id', 'createdAt'], {
      name: 'admin_audit_log_actor_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admin_audit_log');
  },
};
