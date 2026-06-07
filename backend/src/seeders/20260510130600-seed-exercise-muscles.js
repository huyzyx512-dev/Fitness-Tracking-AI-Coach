'use strict';

/**
 * Junction rows for exercise <-> muscle_group. is_primary flags the main worked muscle.
 * IDs reference renumbered seed-exercises (1..26) and seed-muscle-groups (1..12).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // [exercise_id, muscle_group_id, is_primary]
    const rows = [
      // Push-up
      [1, 1, 1], [1, 5, 0], [1, 3, 0], [1, 9, 0],
      // Pull-up
      [2, 2, 1], [2, 4, 0], [2, 11, 0],
      // Bodyweight Squat
      [3, 6, 1], [3, 8, 0], [3, 7, 0], [3, 10, 0],
      // Barbell Back Squat
      [4, 6, 1], [4, 8, 0], [4, 7, 0], [4, 9, 0],
      // Conventional Deadlift
      [5, 7, 1], [5, 8, 0], [5, 2, 0], [5, 11, 0], [5, 9, 0],
      // Bench Press
      [6, 1, 1], [6, 5, 0], [6, 3, 0],
      // Overhead Press
      [7, 3, 1], [7, 5, 0], [7, 9, 0],
      // Barbell Bent-over Row
      [8, 2, 1], [8, 4, 0], [8, 3, 0], [8, 11, 0],
      // Dumbbell Walking Lunge
      [9, 6, 1], [9, 8, 0], [9, 7, 0], [9, 10, 0],
      // Romanian Deadlift
      [10, 7, 1], [10, 8, 0], [10, 2, 0], [10, 11, 0],
      // Lat Pulldown
      [11, 2, 1], [11, 4, 0], [11, 11, 0],
      // Plank
      [12, 9, 1], [12, 3, 0], [12, 8, 0],
      // Side Plank
      [13, 9, 1], [13, 3, 0], [13, 8, 0],
      // Glute Bridge
      [14, 8, 1], [14, 7, 0], [14, 9, 0],
      // Burpee
      [15, 12, 1], [15, 1, 0], [15, 6, 0], [15, 3, 0], [15, 9, 0],
      // Mountain Climber
      [16, 9, 1], [16, 3, 0], [16, 6, 0],
      // Jump Rope
      [17, 10, 1], [17, 9, 0], [17, 3, 0],
      // Running
      [18, 10, 1], [18, 6, 0], [18, 7, 0], [18, 8, 0], [18, 9, 0],
      // Cycling
      [19, 6, 1], [19, 8, 0], [19, 7, 0], [19, 10, 0],
      // Freestyle Swimming
      [20, 12, 1], [20, 2, 0], [20, 3, 0], [20, 9, 0],
      // Brisk Walking
      [21, 10, 1], [21, 6, 0], [21, 7, 0], [21, 8, 0],
      // Jumping Jack
      [22, 12, 1], [22, 10, 0], [22, 3, 0],
      // Cat-Cow Stretch
      [23, 9, 1], [23, 2, 0],
      // Child Pose
      [24, 2, 1], [24, 3, 0], [24, 9, 0],
      // Hip Flexor Stretch
      [25, 6, 1], [25, 8, 0], [25, 9, 0],
      // Hamstring Stretch
      [26, 7, 1], [26, 10, 0],
    ];

    const exerciseIds = Array.from({ length: 26 }, (_, i) => i + 1);
    await queryInterface.bulkDelete('exercise_muscle', { exercise_id: exerciseIds });
    await queryInterface.bulkInsert(
      'exercise_muscle',
      rows.map(([exercise_id, muscle_group_id, is_primary]) => ({
        exercise_id,
        muscle_group_id,
        is_primary: !!is_primary,
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('exercise_muscle', {
      exercise_id: Array.from({ length: 26 }, (_, i) => i + 1),
    });
  },
};
