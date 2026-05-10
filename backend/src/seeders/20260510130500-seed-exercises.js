'use strict';

/**
 * Exercise IDs renumbered to 1..26. category_id references the renumbered seed-categories
 * (1=Cardio, 2=Strength, 3=Mobility, 4=Bodyweight, 5=HIIT). created_by is null because
 * these are system-provided exercises.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const exercises = [
      // id, name, description, difficulty, equipment, category_id, met
      [1, 'Push-up', 'Bài hít đất cơ bản giúp phát triển cơ ngực, tay sau, vai trước và khả năng ổn định core.', 'beginner', 'none', 4, 3.8],
      [2, 'Pull-up', 'Bài kéo xà phát triển lưng xô, tay trước và lực kéo thân trên.', 'advanced', 'pull-up bar', 4, 8.0],
      [3, 'Bodyweight Squat', 'Bài squat không tạ giúp rèn luyện đùi trước, mông và kỹ thuật gập gối-hông.', 'beginner', 'none', 4, 5.0],
      [4, 'Barbell Back Squat', 'Bài squat với thanh đòn đặt sau vai, tập trung phát triển sức mạnh thân dưới.', 'intermediate', 'barbell', 2, 5.0],
      [5, 'Conventional Deadlift', 'Bài deadlift truyền thống phát triển chuỗi cơ sau gồm mông, đùi sau, lưng và lực nắm.', 'advanced', 'barbell', 2, 6.0],
      [6, 'Bench Press', 'Bài đẩy ngực trên ghế phẳng với thanh đòn, tập trung vào cơ ngực, tay sau và vai trước.', 'intermediate', 'barbell, bench', 2, 3.5],
      [7, 'Overhead Press', 'Bài đẩy vai đứng hoặc ngồi giúp phát triển vai, tay sau và khả năng ổn định thân người.', 'intermediate', 'barbell', 2, 4.0],
      [8, 'Barbell Bent-over Row', 'Bài kéo lưng với thanh đòn trong tư thế gập người, phát triển lưng giữa, xô và tay trước.', 'intermediate', 'barbell', 2, 5.0],
      [9, 'Dumbbell Walking Lunge', 'Bài bước chùng chân với tạ đơn giúp tăng sức mạnh đùi, mông và khả năng thăng bằng.', 'intermediate', 'dumbbell', 2, 6.0],
      [10, 'Romanian Deadlift', 'Biến thể deadlift tập trung vào đùi sau, mông và kiểm soát chuyển động gập hông.', 'intermediate', 'barbell', 2, 4.5],
      [11, 'Lat Pulldown', 'Bài kéo xô bằng máy giúp phát triển cơ lưng xô và cải thiện sức kéo thân trên.', 'beginner', 'machine', 2, 3.5],
      [12, 'Plank', 'Bài giữ thân người thẳng nhằm tăng sức bền core và khả năng ổn định cột sống.', 'beginner', 'none', 4, 3.3],
      [13, 'Side Plank', 'Biến thể plank nghiêng tập trung vào cơ liên sườn, core và ổn định vai.', 'intermediate', 'none', 4, 3.3],
      [14, 'Glute Bridge', 'Bài nâng hông giúp kích hoạt cơ mông, đùi sau và cải thiện kiểm soát vùng hông.', 'beginner', 'none', 4, 3.5],
      [15, 'Burpee', 'Bài toàn thân cường độ cao kết hợp squat, plank, chống đẩy và bật nhảy.', 'advanced', 'none', 5, 8.0],
      [16, 'Mountain Climber', 'Bài cardio toàn thân trong tư thế plank, tăng nhịp tim và rèn core.', 'intermediate', 'none', 5, 8.0],
      [17, 'Jump Rope', 'Bài nhảy dây giúp cải thiện sức bền tim mạch, phối hợp vận động và sức bật cổ chân.', 'intermediate', 'jump rope', 1, 12.3],
      [18, 'Running', 'Chạy bộ là bài cardio phổ biến giúp tăng sức bền, cải thiện tim mạch và đốt calories hiệu quả.', 'intermediate', 'none', 1, 9.8],
      [19, 'Cycling', 'Đạp xe giúp tăng sức bền tim mạch, phát triển thân dưới và giảm áp lực lên khớp gối so với chạy.', 'beginner', 'bicycle', 1, 7.5],
      [20, 'Freestyle Swimming', 'Bơi sải là bài cardio toàn thân, tác động nhiều đến vai, lưng, core và hệ hô hấp.', 'intermediate', 'swimming pool', 1, 8.3],
      [21, 'Brisk Walking', 'Đi bộ nhanh phù hợp cho người mới bắt đầu, hỗ trợ sức khỏe tim mạch và kiểm soát cân nặng.', 'beginner', 'none', 1, 4.3],
      [22, 'Jumping Jack', 'Bài bật nhảy dang tay chân giúp làm nóng cơ thể, tăng nhịp tim và rèn sức bền.', 'beginner', 'none', 5, 8.0],
      [23, 'Cat-Cow Stretch', 'Động tác linh hoạt cột sống giúp giảm căng cứng lưng và cải thiện kiểm soát vùng core.', 'beginner', 'none', 3, 2.3],
      [24, 'Child Pose', 'Tư thế giãn cơ thư giãn giúp kéo giãn lưng dưới, vai và hông.', 'beginner', 'none', 3, 2.0],
      [25, 'Hip Flexor Stretch', 'Bài giãn cơ gập hông giúp cải thiện biên độ duỗi hông, hữu ích cho người ngồi nhiều.', 'beginner', 'none', 3, 2.3],
      [26, 'Hamstring Stretch', 'Bài giãn cơ đùi sau giúp giảm căng cứng chân sau và cải thiện khả năng gập hông.', 'beginner', 'none', 3, 2.3],
    ];

    const ids = exercises.map((e) => e[0]);
    await queryInterface.bulkDelete('exercise', { id: ids });
    await queryInterface.bulkInsert(
      'exercise',
      exercises.map(([id, name, description, difficulty_level, equipment, category_id, met_value]) => ({
        id,
        name,
        description,
        created_by: null,
        difficulty_level,
        equipment,
        met_value,
        video_url: null,
        thumbnail_url: null,
        category_id,
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('exercise', {
      id: Array.from({ length: 26 }, (_, i) => i + 1),
    });
  },
};
