import crypto from "crypto";
import bcrypt from "bcrypt";
import asyncHandler from "../middlewares/asyncHandler.js";
import db from "../models/index.js";
import { parseSchema } from "../validators/common.js";
import {
  adminCreateUserSchema,
  adminBulkRoleChangeSchema,
  adminBulkStatusChangeSchema,
  adminResetPasswordSchema,
  adminRoleChangeSchema,
  adminStatusChangeSchema,
  updateUserSchema,
} from "../validators/userValidator.js";
import { recordAdminAudit, ADMIN_AUDIT_ACTIONS } from "../services/adminAuditLogService.js";
import { assertAdminPasswordReauth } from "../services/adminPasswordReauthService.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors/AppError.js";
import { Op, col, fn } from "sequelize";
import TokenService from "../services/tokenService.js";

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

/** Invalidate JWT + refresh bindings after forced password change; preserve locked/active sign. */
function bumpTokenVersionAfterPasswordReset(currentTokenVersion) {
  const current = Number(currentTokenVersion) || 0;
  if (current < 0) {
    return -(Math.abs(current) + 1);
  }
  return current + 1;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function countUsersWithRoleName(roleName) {
  const roleRecord = await db.Role.findOne({ where: { name: roleName } });
  if (!roleRecord) return 0;
  return db.User.count({ where: { role_id: roleRecord.id } });
}

async function countActiveAdmins() {
  const adminRole = await db.Role.findOne({ where: { name: "ADMIN" } });
  if (!adminRole) return 0;
  return db.User.count({
    where: {
      role_id: adminRole.id,
      tokenVersion: { [Op.gte]: 0 },
    },
  });
}

// Lấy thời gian đăng nhập gần nhất của người dùng theo userId
async function getLastLoginAtByUserId(userId) {
  const latestLoginLog = await db.AdminAuditLog.findOne({
    where: {
      target_user_id: userId,
      action: ADMIN_AUDIT_ACTIONS.USER_LOGIN,
    },
    attributes: ["createdAt"],
    order: [["createdAt", "DESC"]],
  });

  return latestLoginLog?.createdAt ?? null;
}

// Lấy thời gian đăng nhập gần nhất của người dùng theo danh sách userId
async function getLastLoginMap(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  const rows = await db.AdminAuditLog.findAll({
    where: {
      target_user_id: { [Op.in]: userIds },
      action: ADMIN_AUDIT_ACTIONS.USER_LOGIN,
    },
    attributes: ["target_user_id", [fn("MAX", col("createdAt")), "lastLoginAt"]],
    group: ["target_user_id"],
    raw: true,
  });

  const map = new Map();
  for (const row of rows) {
    map.set(Number(row.target_user_id), row.lastLoginAt ?? null);
  }
  return map;
}

export const getAdminUsers = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const role = String(req.query.role || "").trim().toUpperCase();
  const status = String(req.query.status || "").trim().toLowerCase();
  const sortBy = String(req.query.sortBy || "createdAt").trim();
  const order = String(req.query.order || "desc").trim().toLowerCase();
  const allowedSortBy = ["createdAt", "name", "email", "lastLoginAt"];
  const allowedOrder = ["asc", "desc"];

  if (role && !ALLOWED_ADMIN_ROLES.includes(role)) {
    throw new ValidationError("Vai trò lọc không hợp lệ");
  }

  if (status && !ALLOWED_USER_STATUS.includes(status)) {
    throw new ValidationError("Trạng thái lọc không hợp lệ");
  }
  if (!allowedSortBy.includes(sortBy)) {
    throw new ValidationError("Trường sắp xếp không hợp lệ");
  }
  if (!allowedOrder.includes(order)) {
    throw new ValidationError("Thứ tự sắp xếp không hợp lệ");
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

  let count = 0;
  let users = [];

  if (sortBy === "lastLoginAt") {
    const rows = await db.User.findAll({
      where,
      include: [roleInclude],
      attributes: { exclude: ["password_hash"] },
      order: [["createdAt", "DESC"]],
    });
    count = rows.length;

    const userIds = rows.map((row) => row.id);
    const lastLoginMap = await getLastLoginMap(userIds);

    const allUsers = rows.map((user) => {
      const plain = user.toJSON();
      return {
        ...plain,
        status: toStatusFromTokenVersion(plain.tokenVersion),
        lastLoginAt: lastLoginMap.get(plain.id) ?? null,
      };
    });

    allUsers.sort((a, b) => {
      const aTs = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : null;
      const bTs = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : null;

      if (aTs === bTs) return Number(b.id) - Number(a.id);
      if (aTs === null) return order === "asc" ? -1 : 1;
      if (bTs === null) return order === "asc" ? 1 : -1;
      return order === "asc" ? aTs - bTs : bTs - aTs;
    });

    users = allUsers.slice(offset, offset + limit);
  } else {
    const { rows, count: total } = await db.User.findAndCountAll({
      where,
      include: [roleInclude],
      attributes: { exclude: ["password_hash"] },
      order: [[sortBy, order.toUpperCase()], ["id", "DESC"]],
      limit,
      offset,
    });
    count = total;

    const userIds = rows.map((row) => row.id);
    const lastLoginMap = await getLastLoginMap(userIds);

    users = rows.map((user) => {
      const plain = user.toJSON();
      return {
        ...plain,
        status: toStatusFromTokenVersion(plain.tokenVersion),
        lastLoginAt: lastLoginMap.get(plain.id) ?? null,
      };
    });
  }

  return res.status(200).json({
    users,
    pagination: { page, limit, total: count },
  });
});

export const getAdminUserById = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  const targetUser = await db.User.findOne({
    where: { id: userId },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  const lastLoginAt = await getLastLoginAtByUserId(userId);
  const plain = targetUser.toJSON();

  return res.status(200).json({
    user: {
      ...plain,
      status: toStatusFromTokenVersion(plain.tokenVersion),
      lastLoginAt,
    },
  });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const { email, name, password, role: nextRole, adminPassword } = parseSchema(
    adminCreateUserSchema,
    req.body,
  );
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ConflictError("Email đã được sử dụng");
  }

  const roleRecord = await db.Role.findOne({ where: { name: nextRole } });
  if (!roleRecord) throw new NotFoundError("Không tìm thấy vai trò");

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = await db.User.create({
    email: normalizedEmail,
    password_hash,
    name: name.trim(),
    role_id: roleRecord.id,
    tokenVersion: 0,
    weight: 70.0,
    height: 170.0,
    gender: "male",
    date_of_birth: null,
  });

  await recordAdminAudit({
    actorUserId: req.user.id,
    targetUserId: newUser.id,
    action: ADMIN_AUDIT_ACTIONS.USER_CREATED,
    metadata: { assignedRole: nextRole, email: normalizedEmail },
    req,
  });

  const created = await db.User.findOne({
    where: { id: newUser.id },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const plain = created.toJSON();
  return res.status(201).json({
    message: "Đã tạo tài khoản người dùng",
    user: { ...plain, status: toStatusFromTokenVersion(plain.tokenVersion) },
  });
});

export const updateAdminUserStatus = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  const { status, adminPassword } = parseSchema(adminStatusChangeSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  if (req.user.id === userId && status === "locked") {
    throw new ValidationError("Không thể tự khóa tài khoản của chính bạn");
  }

  const targetUser = await db.User.findByPk(userId, {
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  if (
    status === "locked" &&
    targetUser.role?.name === "ADMIN" &&
    Number(targetUser.tokenVersion) >= 0
  ) {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ValidationError("Không thể khóa admin hoạt động cuối cùng của hệ thống");
    }
  }

  const previousStatus = toStatusFromTokenVersion(targetUser.tokenVersion);
  const nextTokenVersion = buildTokenVersionByStatus(targetUser.tokenVersion, status);
  await targetUser.update({ tokenVersion: nextTokenVersion });

  await recordAdminAudit({
    actorUserId: req.user.id,
    targetUserId: userId,
    action: ADMIN_AUDIT_ACTIONS.USER_STATUS_CHANGED,
    metadata: { previousStatus, nextStatus: status },
    req,
  });

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

  const { role: nextRole, adminPassword } = parseSchema(adminRoleChangeSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const roleRecord = await db.Role.findOne({ where: { name: nextRole } });
  if (!roleRecord) throw new NotFoundError("Không tìm thấy vai trò");

  const targetUser = await db.User.findByPk(userId, {
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  if (req.user.id === userId && nextRole !== "ADMIN") {
    throw new ValidationError("Không thể tự hạ quyền của chính bạn");
  }

  const currentRoleName = targetUser.role?.name;
  if (currentRoleName === "ADMIN" && nextRole !== "ADMIN") {
    const adminUsers = await countUsersWithRoleName("ADMIN");
    if (adminUsers <= 1) {
      throw new ValidationError("Không thể thu hồi vai trò admin của người dùng admin duy nhất");
    }
  }

  const previousRole = targetUser.role?.name ?? null;
  await targetUser.update({ role_id: roleRecord.id });

  await recordAdminAudit({
    actorUserId: req.user.id,
    targetUserId: userId,
    action: ADMIN_AUDIT_ACTIONS.USER_ROLE_CHANGED,
    metadata: { previousRole, nextRole },
    req,
  });

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

// Cập nhật trạng thái người dùng hàng loạt bằng admin password
export const updateAdminUsersBulkStatus = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const { userIds, status, adminPassword } = parseSchema(adminBulkStatusChangeSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const targetIds = [...new Set(userIds.map(Number))].filter((id) => id > 0 && id !== req.user.id);
  if (targetIds.length === 0) {
    throw new ValidationError("Danh sách người dùng hợp lệ để cập nhật đang trống");
  }

  const targets = await db.User.findAll({
    where: { id: { [Op.in]: targetIds } },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const targetMap = new Map(targets.map((user) => [Number(user.id), user]));
  const succeeded = [];
  const failed = [];

  for (const userId of targetIds) {
    const targetUser = targetMap.get(userId);
    if (!targetUser) {
      failed.push({ id: userId, reason: "Không tìm thấy người dùng" });
      continue;
    }

    try {
      if (
        status === "locked" &&
        targetUser.role?.name === "ADMIN" &&
        Number(targetUser.tokenVersion) >= 0
      ) {
        const activeAdmins = await countActiveAdmins();
        if (activeAdmins <= 1) {
          throw new ValidationError("Không thể khóa admin hoạt động cuối cùng của hệ thống");
        }
      }

      const previousStatus = toStatusFromTokenVersion(targetUser.tokenVersion);
      const nextTokenVersion = buildTokenVersionByStatus(targetUser.tokenVersion, status);
      await targetUser.update({ tokenVersion: nextTokenVersion });

      await recordAdminAudit({
        actorUserId: req.user.id,
        targetUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.USER_STATUS_CHANGED,
        metadata: { previousStatus, nextStatus: status, isBulkAction: true },
        req,
      });

      succeeded.push(userId);
    } catch (error) {
      failed.push({ id: userId, reason: error?.message || "Không thể cập nhật trạng thái người dùng" });
    }
  }

  return res.status(200).json({
    message: "Đã xử lý cập nhật trạng thái hàng loạt",
    succeeded,
    failed,
  });
});

// Cập nhật vai trò người dùng hàng loạt bằng admin password
export const updateAdminUsersBulkRole = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const { userIds, role: nextRole, adminPassword } = parseSchema(adminBulkRoleChangeSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const roleRecord = await db.Role.findOne({ where: { name: nextRole } });
  if (!roleRecord) throw new NotFoundError("Không tìm thấy vai trò");

  const targetIds = [...new Set(userIds.map(Number))].filter((id) => id > 0 && id !== req.user.id);
  if (targetIds.length === 0) {
    throw new ValidationError("Danh sách người dùng hợp lệ để cập nhật đang trống");
  }

  const targets = await db.User.findAll({
    where: { id: { [Op.in]: targetIds } },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const targetMap = new Map(targets.map((user) => [Number(user.id), user]));
  const succeeded = [];
  const failed = [];

  for (const userId of targetIds) {
    const targetUser = targetMap.get(userId);
    if (!targetUser) {
      failed.push({ id: userId, reason: "Không tìm thấy người dùng" });
      continue;
    }

    try {
      const previousRole = targetUser.role?.name ?? null;
      if (previousRole === "ADMIN" && nextRole !== "ADMIN") {
        const adminUsers = await countUsersWithRoleName("ADMIN");
        if (adminUsers <= 1) {
          throw new ValidationError("Không thể thu hồi vai trò admin của người dùng admin duy nhất");
        }
      }

      await targetUser.update({ role_id: roleRecord.id });
      await targetUser.reload({ include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }] });

      await recordAdminAudit({
        actorUserId: req.user.id,
        targetUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.USER_ROLE_CHANGED,
        metadata: { previousRole, nextRole, isBulkAction: true },
        req,
      });

      succeeded.push(userId);
    } catch (error) {
      failed.push({ id: userId, reason: error?.message || "Không thể cập nhật vai trò người dùng" });
    }
  }

  return res.status(200).json({
    message: "Đã xử lý cập nhật vai trò hàng loạt",
    succeeded,
    failed,
  });
});

export const resetAdminUserPassword = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const { adminPassword } = parseSchema(adminResetPasswordSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  if (req.user.id === userId) {
    throw new ValidationError("Không thể đặt lại mật khẩu tài khoản đang đăng nhập qua chức năng này");
  }

  const targetUser = await db.User.findByPk(userId, {
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  const temporaryPassword = generateTemporaryPassword();
  const password_hash = await bcrypt.hash(temporaryPassword, 10);
  const nextTokenVersion = bumpTokenVersionAfterPasswordReset(targetUser.tokenVersion);

  await targetUser.update({
    password_hash,
    tokenVersion: nextTokenVersion,
  });

  await TokenService.revokeAllUserSessions(userId);

  await recordAdminAudit({
    actorUserId: req.user.id,
    targetUserId: userId,
    action: ADMIN_AUDIT_ACTIONS.USER_PASSWORD_RESET,
    metadata: { sessionsRevoked: true },
    req,
  });

  const updatedUser = await db.User.findOne({
    where: { id: userId },
    attributes: { exclude: ["password_hash"] },
    include: [{ model: db.Role, as: "role", attributes: ["id", "name"] }],
  });

  const plain = updatedUser.toJSON();
  return res.status(200).json({
    message: "Đã đặt lại mật khẩu và thu hồi phiên đăng nhập của người dùng",
    temporaryPassword,
    user: { ...plain, status: toStatusFromTokenVersion(plain.tokenVersion) },
  });
});

// Buộc đăng xuất tất cả phiên của người dùng bằng admin password
export const forceLogoutAdminUser = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const { adminPassword } = parseSchema(adminResetPasswordSchema, req.body);
  await assertAdminPasswordReauth(req.user.id, adminPassword);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");
  if (req.user.id === userId) {
    throw new ValidationError("Không thể buộc đăng xuất tài khoản đang đăng nhập");
  }

  const targetUser = await db.User.findByPk(userId, { attributes: ["id"] });
  if (!targetUser) throw new NotFoundError("Không tìm thấy người dùng");

  await TokenService.revokeAllUserSessions(userId);

  await recordAdminAudit({
    actorUserId: req.user.id,
    targetUserId: userId,
    action: ADMIN_AUDIT_ACTIONS.USER_FORCE_LOGOUT,
    metadata: { sessionsRevoked: true },
    req,
  });

  return res.status(200).json({
    message: "Đã buộc đăng xuất tất cả phiên của người dùng",
  });
});

export const getAdminUserAuditLogs = asyncHandler(async (req, res) => {
  assertAdmin(req);

  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError("ID người dùng không hợp lệ");

  const exists = await db.User.findByPk(userId, { attributes: ["id"] });
  if (!exists) throw new NotFoundError("Không tìm thấy người dùng");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const { rows, count } = await db.AdminAuditLog.findAndCountAll({
    where: { target_user_id: userId },
    include: [
      {
        model: db.User,
        as: "actor",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const logs = rows.map((row) => {
    const j = row.toJSON();
    return {
      id: j.id,
      action: j.action,
      metadata: j.metadata,
      createdAt: j.createdAt,
      actor: j.actor
        ? { id: j.actor.id, name: j.actor.name, email: j.actor.email }
        : null,
    };
  });

  return res.status(200).json({
    logs,
    pagination: { page, limit, total: count },
  });
});
