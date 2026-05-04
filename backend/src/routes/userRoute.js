import express from "express"
import {
  getAdminUsers,
  getUser,
  updateAdminUserRole,
  updateAdminUserStatus,
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

router.get("/admin/users", authenticationToken, getAdminUsers)
router.patch("/admin/users/:id/status", authenticationToken, updateAdminUserStatus)
router.patch("/admin/users/:id/role", authenticationToken, updateAdminUserRole)

export default router