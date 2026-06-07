'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_request_log', {
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
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Loại request: ask, workout_plan',
      },
      input: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Dữ liệu đầu vào (không chứa API key)',
      },
      output: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Dữ liệu đầu ra từ AI provider',
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'Trạng thái: success, failed',
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Tên provider: openai, ...',
      },
      model: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Tên model đã dùng, ví dụ gpt-4.1-mini',
      },
      input_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      output_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('ai_request_log', ['user_id'], {
      name: 'idx_ai_request_log_user_id',
    });
    await queryInterface.addIndex('ai_request_log', ['type'], {
      name: 'idx_ai_request_log_type',
    });
    await queryInterface.addIndex('ai_request_log', ['status'], {
      name: 'idx_ai_request_log_status',
    });
    await queryInterface.addIndex('ai_request_log', ['createdAt'], {
      name: 'idx_ai_request_log_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_request_log');
  },
};
