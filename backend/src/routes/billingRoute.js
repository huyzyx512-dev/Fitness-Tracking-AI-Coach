import express from "express";
import {
  createOrder,
  getCurrentSubscription,
  getOrder,
  listPlans,
} from "../controllers/billingController.js";
import { authenticationToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/** Public — pricing page can render without auth. */
router.get("/plans", listPlans);

router.get("/subscription", authenticationToken, getCurrentSubscription);
router.post("/orders", authenticationToken, createOrder);
router.get("/orders/:id", authenticationToken, getOrder);

export default router;
