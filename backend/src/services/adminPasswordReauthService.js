import bcrypt from "bcrypt";
import db from "../models/index.js";
import { ValidationError } from "../errors/AppError.js";

/**
 * Verifies the acting admin's account password before sensitive mutations.
 * Loads hash in a narrow query (not attached to req.user).
 */
export async function assertAdminPasswordReauth(adminUserId, plainPassword) {
  if (plainPassword == null || String(plainPassword).length === 0) {
    throw new ValidationError("Vui lòng nhập mật khẩu tài khoản quản trị để xác nhận");
  }

  const row = await db.User.findByPk(adminUserId, { attributes: ["password_hash"] });
  if (!row?.password_hash) {
    throw new ValidationError("Không thể xác thực mật khẩu quản trị");
  }

  const ok = await bcrypt.compare(String(plainPassword), row.password_hash);
  if (!ok) {
    throw new ValidationError("Mật khẩu xác nhận không đúng");
  }
}
