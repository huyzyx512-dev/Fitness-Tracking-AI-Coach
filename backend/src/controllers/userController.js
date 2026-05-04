import asyncHandler from "../middlewares/asyncHandler.js";
import db from "../models/index.js";
import { parseSchema } from "../validators/common.js";
import { updateUserSchema } from "../validators/userValidator.js";

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

const adminRouteNotImplemented = (endpointName) =>
  asyncHandler(async (_req, res) => {
    return res.status(501).json({
      message: `${endpointName} is defined for admin user management MVP but not implemented yet.`,
    });
  });

export const listAdminUsers = adminRouteNotImplemented("GET /api/user/admin/users");
export const getAdminUserById = adminRouteNotImplemented("GET /api/user/admin/users/:id");
export const createAdminUser = adminRouteNotImplemented("POST /api/user/admin/users");
export const updateAdminUser = adminRouteNotImplemented("PATCH /api/user/admin/users/:id");
export const updateAdminUserStatus = adminRouteNotImplemented("PATCH /api/user/admin/users/:id/status");
export const updateAdminUserRole = adminRouteNotImplemented("PATCH /api/user/admin/users/:id/role");
