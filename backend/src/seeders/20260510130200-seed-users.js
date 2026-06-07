'use strict';

const bcrypt = require('bcrypt');

/**
 * Demo accounts for development only. Passwords are well-known and MUST NOT be
 * carried into production. role_id values mirror seed-roles (USER=1, ADMIN=2, COACH=3).
 *
 * Login:
 *   admin@example.com / Admin@123
 *   user@example.com  / User@123
 *   coach@example.com / Coach@123
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const emails = ['admin@example.com', 'user@example.com', 'coach@example.com'];

    const [adminHash, userHash, coachHash] = await Promise.all([
      bcrypt.hash('Admin@123', 10),
      bcrypt.hash('User@123', 10),
      bcrypt.hash('Coach@123', 10),
    ]);

    await queryInterface.bulkDelete('user', { email: emails });
    await queryInterface.bulkInsert('user', [
      {
        email: 'admin@example.com',
        password_hash: adminHash,
        name: 'System Admin',
        tokenVersion: 0,
        role_id: 2,
        weight: 70.00,
        height: 175.00,
        gender: 'male',
        date_of_birth: '1995-01-01',
        subscription_tier: 'FREE',
        subscription_expires_at: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        email: 'user@example.com',
        password_hash: userHash,
        name: 'Demo User',
        tokenVersion: 0,
        role_id: 1,
        weight: 65.50,
        height: 170.00,
        gender: 'female',
        date_of_birth: '2000-06-15',
        subscription_tier: 'FREE',
        subscription_expires_at: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        email: 'coach@example.com',
        password_hash: coachHash,
        name: 'Demo Coach',
        tokenVersion: 0,
        role_id: 3,
        weight: 78.00,
        height: 180.00,
        gender: 'male',
        date_of_birth: '1990-09-20',
        subscription_tier: 'FREE',
        subscription_expires_at: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user', {
      email: ['admin@example.com', 'user@example.com', 'coach@example.com'],
    });
  },
};
