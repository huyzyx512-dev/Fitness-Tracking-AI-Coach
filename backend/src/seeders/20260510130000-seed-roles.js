'use strict';

/**
 * Authoritative role list. Names match validators (z.enum(["ADMIN","USER","COACH"]))
 * and the lookup in authService (Role.findOne({ where: { name: "USER" } })).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkDelete('role', { name: ['USER', 'ADMIN', 'COACH'] });
    await queryInterface.bulkInsert('role', [
      { id: 1, name: 'USER', createdAt: now, updatedAt: now },
      { id: 2, name: 'ADMIN', createdAt: now, updatedAt: now },
      { id: 3, name: 'COACH', createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role', { name: ['USER', 'ADMIN', 'COACH'] });
  },
};
