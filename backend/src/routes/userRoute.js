import express from "express"
import {
  createAdminUser,
  getAdminUserAuditLogs,
  getAdminUsers,
  getUser,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateUser,
} from "../controllers/userController.js";
import { authenticationToken } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden: admin role required." });
  }

  return next();
};

router.get("/", authenticationToken ,getUser)

// Update current user's profile (name, weight, height, gender, date_of_birth)
router.patch("/", authenticationToken, updateUser)

router.post("/admin/users", authenticationToken, requireAdmin, createAdminUser)
router.get("/admin/users", authenticationToken, requireAdmin, getAdminUsers)
router.get("/admin/users/:id/audit", authenticationToken, requireAdmin, getAdminUserAuditLogs)
router.patch("/admin/users/:id/status", authenticationToken, requireAdmin, updateAdminUserStatus)
router.patch("/admin/users/:id/role", authenticationToken, requireAdmin, updateAdminUserRole)
router.post("/admin/users/:id/reset-password", authenticationToken, requireAdmin, resetAdminUserPassword)

export default router