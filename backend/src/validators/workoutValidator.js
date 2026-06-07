import { z } from "zod";

const isDateString = (value) => !Number.isNaN(Date.parse(value));

/**
 * scheduled_at là tuỳ chọn:
 *   - undefined / "" / null → null
 *   - chuỗi không rỗng phải parse được thành Date
 * Không set giờ mặc định; luôn để DB nhận null khi user bỏ trống.
 */
const optionalScheduledAt = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    return value;
  },
  z
    .string()
    .nullable()
    .refine((value) => value === null || isDateString(value), {
      message: "Định dạng ngày tháng không hợp lệ",
    }),
);

export const createWorkoutSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề"),
  notes: z.string().trim().min(1, "Vui lòng nhập ghi chú"),
  scheduled_at: optionalScheduledAt,
});

export const updateWorkoutSchema = createWorkoutSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: "Vui lòng cập nhật ít nhất một thông tin" },
);

export const completeWorkoutSchema = z.object({
  comment: z.string().trim().max(1000, "Bình luận không được vượt quá 1000 ký tự").optional().default(""),
});

export const workoutLogCreateSchema = z.object({
  workout_id: z.coerce.number().int().positive("ID bài tập phải lớn hơn 0"),
  completed_at: z.string().refine(isDateString, { message: "Thời gian hoàn thành không hợp lệ" }).optional(),
  duration_minutes: z.coerce.number().int().min(0, "Thời lượng tập phải từ 0 phút trở lên"),
  calories_burned: z.coerce.number().int().min(0, "Lượng calo đốt cháy phải từ 0 trở lên"),
  comment: z.string().trim().max(1000, "Bình luận không được vượt quá 1000 ký tự").optional().default(""),
});