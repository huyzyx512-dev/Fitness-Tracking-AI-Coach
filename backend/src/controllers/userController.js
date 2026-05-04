import asyncHandler from "../middlewares/asyncHandler.js";
import db from "../models/index.js";
import { parseSchema } from "../validators/common.js";
import { updateUserSchema } from "../validators/userValidator.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/AppError.js";
import { Op } from "sequelize";

export const getUser = asyncHandler(async (req, res) => {
  return res.status(200).json({ user: req.user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const updates = parseSchema(updateUserSchema, req.body);

  await db.User.update(updates, { where: { id: req.user.id } });

  const updatedUser = await db.User.findOne({
    where: { id: req.user.id },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role" }],
  });

  return res.status(200).json({ user: updatedUser });
});

const ALLOWED_ADMIN_ROLES = ["ADMIN", "USER", "COACH"];
const ALLOWED_USER_STATUS = ["active", "locked"];

function assertAdmin(req) {
  if (req.user?.role?.name !== "ADMIN") {
    throw new ForbiddenError("Bạn không có quyền truy cập chức năng quản trị người dùng");
  }
}

function toStatusFromTokenVersion(tokenVersion) {
  return Number(tokenVersion) < 0 ? "locked" : "active";
}

function buildTokenVersionByStatus(currentTokenVersion, status) {
  const current = Number(currentTokenVersion) || 0;
  if (status === "locked") {
    return current < 0 ? current : -(Math.abs(current) + 1);
  }
  return Math.abs(current) + 1;
}

export const getAdminUsers = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const role = String(req.query.role || "").trim().toUpperCase();
  const status = String(req.query.status || "").trim().toLowerCase();

  if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
    throw new ValidationError("Vai trò lọc không hợp lệ");
  }

  if (status && !ALLOWED_USER_STATUS.includes(status)) {
    throw new ValidationError("Trạng thái lọc không hợp lệ");
  }

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status === "locked") {
    where.tokenVersion = { [Op.lt]: 0 };
  }
  if (status === "active") {
    where.tokenVersion = { [Op.gte]: 0 };
  }

  const roleInclude = {
    model: db.Role,
    as: "role",
    ...(role ? { where: { name: role } } : {}),
    attributes: ["id", "name"],
    required: !!role,
  };

  const { rows, count } = await db.User.findAndCountAll({
    where,
    include: [roleInclude],
    attributes: { exclude: ["password_hash"] },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const users = rows.map((user) => {
    const plain = user.toJSON();
    return {
      ...plain,
      status: toStatusFromTokenVersion(plain.tokenVersion),
    };
  });

  return res.status(200).json({
    users,
    pagination: { page, limit, total: count },
  });
});

export const updateAdminUserStatus = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!ALLOWED_USER_STATUS.includes(status)) {
    throw new ValidationError("Trạng thái không hợp lệ");
  }

  if (req.user.id === userId && status === "locked") {
    throw new ValidationError("Không thể tự khóa tài khoản của chính bạn");
  }

  const targetUser = await db.User.findByPk(userId);
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  const nextTokenVersion = buildTokenVersionByStatus(targetUser.tokenVersion, status);
  await targetUser.update({ tokenVersion: nextTokenVersion });

  const updatedUser = await db.User.findOne({
    where: { id: userId },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const plain = updatedUser.toJSON();
  return res.status(200).json({
    message: status === "locked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
    user: { ...plain, status: toStatusFromTokenVersion(plain.tokenVersion) },
  });
});

export const updateAdminUserRole = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  const nextRole = String(req.body?.role || "").trim().toUpperCase();
  if (!ALLOWED_ADMIN_ROLES.includes(nextRole)) {
    throw new ValidationError("Vai trò không hợp lệ");
  }

  const roleRecord = await db.Role.findOne({ where: { name: nextRole } });
  if (!roleRecord) throw new NotFoundError("Không tìm thấy vai trò");

  const targetUser = await db.User.findByPk(userId);
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  if (req.user.id === userId && nextRole !== "ADMIN") {
    throw new ValidationError("Không thể tự hạ quyền của chính bạn");
  }

  await targetUser.update({ role_id: roleRecord.id });

  const updatedUser = await db.User.findOne({
    where: { id: userId },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const plain = updatedUser.toJSON();
  return res.status(200).json({
    message: "Đã cập nhật vai trò người dùng",
    user: { ...plain, status: toStatusFromTokenVersion(plain.tokenVersion) },
  });
});
