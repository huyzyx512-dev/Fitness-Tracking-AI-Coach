import { z } from "zod";

export const createOrderSchema = z.object({
  planCode: z
    .string({ required_error: "Vui lòng chọn gói đăng ký" })
    .trim()
    .min(1, "Vui lòng chọn gói đăng ký")
    .max(32, "Mã gói không hợp lệ")
    .transform((value) => value.toUpperCase()),
});
