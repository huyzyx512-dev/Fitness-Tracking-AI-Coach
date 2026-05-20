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
