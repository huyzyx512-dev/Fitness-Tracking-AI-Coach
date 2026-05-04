import express from "express"
import {
  getAdminUsers,
  getUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../controllers/userController.js";
import { authenticationToken } from "../middlewares/authMiddleware.js";
import { updateUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/", authenticationToken ,getUser)

// Update current user's profile (name, weight, height, gender, date_of_birth)
router.patch("/", authenticationToken, updateUser)

router.get("/admin/users", authenticationToken, getAdminUsers)
router.patch("/admin/users/:id/status", authenticationToken, updateAdminUserStatus)
router.patch("/admin/users/:id/role", authenticationToken, updateAdminUserRole)

export default router