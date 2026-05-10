'use strict';

/**
 * Renumbered IDs (1..12) for a clean DB. Update seed-exercise-muscles if you change these.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const groups = [
      { id: 1, name: 'Chest' },
      { id: 2, name: 'Back' },
      { id: 3, name: 'Shoulders' },
      { id: 4, name: 'Biceps' },
      { id: 5, name: 'Triceps' },
      { id: 6, name: 'Quadriceps' },
      { id: 7, name: 'Hamstrings' },
      { id: 8, name: 'Glutes' },
      { id: 9, name: 'Core' },
      { id: 10, name: 'Calves' },
      { id: 11, name: 'Forearms' },
      { id: 12, name: 'Full Body' },
    ];

    await queryInterface.bulkDelete('muscle_group', {
      id: groups.map((g) => g.id),
    });
    await queryInterface.bulkInsert(
      'muscle_group',
      groups.map((g) => ({ ...g, createdAt: now, updatedAt: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('muscle_group', {
      id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  },
};
