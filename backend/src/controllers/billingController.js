import asyncHandler from "../middlewares/asyncHandler.js";
import BillingService from "../services/billingService.js";
import { parseSchema } from "../validators/common.js";
import { createOrderSchema } from "../validators/billingValidator.js";
import { ValidationError } from "../errors/AppError.js";

/**
 * Webhook mount uses express.raw — req.body is a Buffer. Parse JSON / urlencoded for SePay payload.
 * rawBodyString must stay identical to the bytes SePay signed for HMAC verification.
 */
function parseSepayWebhookPayload(req) {
  const raw =
    Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : "";
  const ct = String(req.headers["content-type"] || "").toLowerCase();

  let payload = {};
  if (!raw || !raw.trim()) {
    return { payload, rawBodyString: raw };
  }

  if (ct.includes("application/json") || raw.trim().startsWith("{")) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    payload = Object.fromEntries(params.entries());
  } else {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }

  return { payload, rawBodyString: raw };
}

export const listPlans = asyncHandler(async (_req, res) => {
  const plans = await BillingService.listActivePlans();
  return res.status(200).json({ plans });
});

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const subscription = await BillingService.getCurrentSubscription(req.user.id);
  return res.status(200).json({ subscription });
});

export const createOrder = asyncHandler(async (req, res) => {
  const payload = parseSchema(createOrderSchema, req.body);
  const order = await BillingService.createOrderForUser(req.user, payload.planCode);
  return res.status(201).json({ order });
});

export const getOrder = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new ValidationError("ID đơn thanh toán không hợp lệ");
  }
  const order = await BillingService.getOrderForUser(req.user.id, orderId);
  return res.status(200).json({ order });
});

export const sepayWebhook = asyncHandler(async (req, res) => {
  const { payload, rawBodyString } = parseSepayWebhookPayload(req);
  await BillingService.handleSepayWebhook(req, payload, rawBodyString);
  /**
   * SePay chỉ coi giao dịch webhook thành công khi HTTP 200/201 và body JSON có `success: true`
   * (đúng format — không thay bằng `ok` hay thêm field khác nếu dashboard vẫn báo lỗi).
   * @see https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook
   */
  return res.status(200).json({ success: true });
});
