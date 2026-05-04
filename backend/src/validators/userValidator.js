import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(3, "Tên phải có ít nhất 3 ký tự").optional(),
    weight: z.coerce.number().positive("Cân nặng phải lớn hơn 0").optional(),
    height: z.coerce.number().positive("Chiều cao phải lớn hơn 0").optional(),
    gender: z.enum(["nam", "nữ", "khác"]).optional(),
    date_of_birth: z.string().min(1, "Vui lòng nhập ngày sinh").optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, { 
    message: "Vui lòng cập nhật ít nhất một thông tin" 
  });

const adminPasswordField = z
  .string()
  .min(1, "Nhập mật khẩu tài khoản quản trị để xác nhận");

export const adminStatusChangeSchema = z.object({
  status: z.enum(["active", "locked"]),
  adminPassword: adminPasswordField,
});

export const adminRoleChangeSchema = z.object({
  role: z.enum(["ADMIN", "USER", "COACH"]),
  adminPassword: adminPasswordField,
});

export const adminResetPasswordSchema = z.object({
  confirm: z.boolean().refine((v) => v === true, {
    message: "Gửi confirm: true để xác nhận đặt lại mật khẩu",
  }),
  adminPassword: adminPasswordField,
});