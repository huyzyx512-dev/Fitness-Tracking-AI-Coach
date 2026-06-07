'use strict';

/**
 * Renumbered IDs (1..5) for a clean DB. Update seed-exercises if you change these.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const ids = [1, 2, 3, 4, 5];
    await queryInterface.bulkDelete('category', { id: ids });
    await queryInterface.bulkInsert('category', [
      {
        id: 1,
        name: 'Cardio',
        description:
          'Các bài tập tăng sức bền tim mạch, cải thiện hệ hô hấp và hỗ trợ đốt calories.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Strength Training',
        description:
          'Các bài tập phát triển sức mạnh cơ bắp bằng tạ, máy hoặc trọng lượng cơ thể.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Mobility & Flexibility',
        description:
          'Các bài tập cải thiện độ linh hoạt, biên độ chuyển động và giảm căng cứng cơ.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        name: 'Bodyweight',
        description:
          'Các bài tập sử dụng trọng lượng cơ thể, phù hợp tập tại nhà hoặc không cần nhiều dụng cụ.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 5,
        name: 'HIIT & Conditioning',
        description:
          'Các bài tập cường độ cao giúp tăng thể lực, sức bền và khả năng trao đổi chất.',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('category', { id: [1, 2, 3, 4, 5] });
  },
};
