'use strict';

/**
 * Tier codes must match TIER_RANK in entitlementMiddleware (FREE, PRO, COACH_PRO).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkDelete('subscription_plan', {
      code: ['FREE', 'PRO', 'COACH_PRO'],
    });
    await queryInterface.bulkInsert('subscription_plan', [
      {
        code: 'FREE',
        name: 'Free',
        price: 0,
        currency: 'VND',
        duration_days: 36500,
        features: JSON.stringify([
          'Theo dõi buổi tập cơ bản',
          'Thư viện bài tập cơ bản',
          'Nhật ký luyện tập',
        ]),
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        code: 'PRO',
        name: 'Pro',
        price: 99000,
        currency: 'VND',
        duration_days: 30,
        features: JSON.stringify([
          'Toàn bộ tính năng Free',
          'Gợi ý bài tập nâng cao',
          'Báo cáo dinh dưỡng và calo',
          'Hỗ trợ ưu tiên',
        ]),
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        code: 'COACH_PRO',
        name: 'Coach Pro',
        price: 249000,
        currency: 'VND',
        duration_days: 30,
        features: JSON.stringify([
          'Toàn bộ tính năng Pro',
          'Quản lý học viên cho huấn luyện viên',
          'Tạo giáo án không giới hạn',
          'Trao đổi với chuyên gia',
        ]),
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subscription_plan', {
      code: ['FREE', 'PRO', 'COACH_PRO'],
    });
  },
};
