import express from "express"
import {
  createAdminUser,
  getAdminUserById,
  getUser,
  listAdminUsers,
  updateAdminUser,
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

// Admin user management (MVP route contract)
router.get("/admin/users", authenticationToken, requireAdmin, listAdminUsers);
router.get("/admin/users/:id", authenticationToken, requireAdmin, getAdminUserById);
router.post("/admin/users", authenticationToken, requireAdmin, createAdminUser);
router.patch("/admin/users/:id", authenticationToken, requireAdmin, updateAdminUser);
router.patch("/admin/users/:id/status", authenticationToken, requireAdmin, updateAdminUserStatus);
router.patch("/admin/users/:id/role", authenticationToken, requireAdmin, updateAdminUserRole);

export default router