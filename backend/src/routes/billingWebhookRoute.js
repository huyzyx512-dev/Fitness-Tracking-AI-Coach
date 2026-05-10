import express from "express";
import { sepayWebhook } from "../controllers/billingController.js";

/**
 * Mounted at /api/billing/webhooks. Provider-to-server traffic only — never gated by JWT.
 * Authentication is handled inside the controller via SepayProvider.verifyWebhook (apikey/secret header).
 */
const router = express.Router();

router.post("/sepay", sepayWebhook);

export default router;
