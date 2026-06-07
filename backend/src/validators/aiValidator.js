import { z } from "zod";

const isDateString = (value) => !Number.isNaN(Date.parse(value));

export const askCoachSchema = z.object({
  message: z
    .string({ required_error: "Vui lòng nhập câu hỏi" })
    .trim()
    .min(1, "Vui lòng nhập câu hỏi")
    .max(2000, "Câu hỏi không được vượt quá 2000 ký tự"),
  context: z
    .object({
      includeProfile: z.boolean().optional().default(false),
      includeWorkoutHistory: z.boolean().optional().default(false),
    })
    .optional(),
});

export const generateWorkoutPlanSchema = z.object({
  goal: z
    .string({ required_error: "Vui lòng nhập mục tiêu" })
    .trim()
    .min(1, "Vui lòng nhập mục tiêu")
    .max(100, "Mục tiêu không được vượt quá 100 ký tự"),
  daysPerWeek: z
    .number({ required_error: "Vui lòng nhập số buổi tập mỗi tuần", invalid_type_error: "Số buổi tập phải là một số" })
    .int("Số buổi tập phải là số nguyên")
    .min(1, "Số buổi tập tối thiểu là 1")
    .max(7, "Số buổi tập tối đa là 7"),
  sessionMinutes: z
    .number({ required_error: "Vui lòng nhập thời lượng buổi tập", invalid_type_error: "Thời lượng buổi tập phải là một số" })
    .int("Thời lượng buổi tập phải là số nguyên")
    .min(15, "Thời lượng tối thiểu là 15 phút")
    .max(180, "Thời lượng tối đa là 180 phút"),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Vui lòng chọn trình độ",
    invalid_type_error: "Trình độ không hợp lệ",
  }),
  equipment: z
    .array(z.string().trim().max(50, "Tên thiết bị không được vượt quá 50 ký tự"))
    .max(20, "Tối đa 20 thiết bị")
    .optional()
    .default([]),
  startDate: z
    .string()
    .refine(isDateString, { message: "Định dạng ngày bắt đầu không hợp lệ" })
    .nullable()
    .optional(),
  height: z
    .number({ invalid_type_error: "Chiều cao phải là một số" })
    .min(50, "Chiều cao tối thiểu là 50cm")
    .max(250, "Chiều cao tối đa là 250cm")
    .optional(),
  weight: z
    .number({ invalid_type_error: "Cân nặng phải là một số" })
    .min(20, "Cân nặng tối thiểu là 20kg")
    .max(300, "Cân nặng tối đa là 300kg")
    .optional(),
  gender: z.string().trim().max(50, "Giới tính không được vượt quá 50 ký tự").optional(),
  injuryOrLimitation: z
    .string()
    .trim()
    .max(1000, "Mô tả chấn thương/hạn chế không được vượt quá 1000 ký tự")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Ghi chú không được vượt quá 2000 ký tự")
    .optional(),
});

export const recommendationIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "id phải là một số" })
    .int("id phải là số nguyên")
    .positive("id phải lớn hơn 0"),
});

/**
 * Schema cho từng bài tập trong editedPlan.
 * Dùng `.passthrough()` để giữ các field khác AI có thể trả (description, category,
 * primaryMuscleGroup, secondaryMuscleGroups...) — service sẽ tự xử lý/clamp.
 */
const editedExerciseSchema = z
  .object({
    exerciseId: z
      .number({ invalid_type_error: "exerciseId phải là một số" })
      .int("exerciseId phải là số nguyên")
      .positive("exerciseId phải lớn hơn 0")
      .nullable()
      .optional(),
    name: z.string().trim().max(200, "Tên bài tập không được vượt quá 200 ký tự").optional(),
    sets: z
      .number({ invalid_type_error: "sets phải là một số" })
      .int("sets phải là số nguyên")
      .min(1, "sets tối thiểu là 1")
      .max(10, "sets tối đa là 10")
      .optional(),
    reps: z
      .number({ invalid_type_error: "reps phải là một số" })
      .int("reps phải là số nguyên")
      .min(1, "reps tối thiểu là 1")
      .max(100, "reps tối đa là 100")
      .optional(),
    weight: z
      .number({ invalid_type_error: "weight phải là một số" })
      .min(0, "weight phải từ 0 trở lên")
      .optional(),
    restTimeSeconds: z
      .number({ invalid_type_error: "restTimeSeconds phải là một số" })
      .int("restTimeSeconds phải là số nguyên")
      .min(0, "restTimeSeconds phải từ 0 trở lên")
      .max(600, "restTimeSeconds tối đa là 600")
      .optional(),
    notes: z.string().max(1000, "Ghi chú không được vượt quá 1000 ký tự").optional(),
  })
  .passthrough();

const editedDaySchema = z
  .object({
    dayIndex: z
      .number({ invalid_type_error: "dayIndex phải là một số" })
      .int("dayIndex phải là số nguyên")
      .positive("dayIndex phải lớn hơn 0"),
    title: z.string().trim().max(200, "Tiêu đề ngày tập không được vượt quá 200 ký tự").optional(),
    focus: z.string().trim().max(500, "Trọng tâm không được vượt quá 500 ký tự").optional(),
    exercises: z.array(editedExerciseSchema).optional(),
  })
  .passthrough();

const editedPlanSchema = z
  .object({
    days: z.array(editedDaySchema).optional(),
  })
  .passthrough();

export const applyRecommendationSchema = z.object({
  selectedDayIndexes: z
    .array(
      z
        .number({ invalid_type_error: "dayIndex phải là một số" })
        .int("dayIndex phải là số nguyên")
        .positive("dayIndex phải lớn hơn 0"),
      { required_error: "Vui lòng chọn ngày tập để áp dụng" },
    )
    .min(1, "Cần chọn ít nhất 1 ngày tập")
    .max(7, "Tối đa 7 ngày tập"),
  editedPlan: editedPlanSchema.optional(),
});
