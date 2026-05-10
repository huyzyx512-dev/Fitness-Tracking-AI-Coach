import crypto from "crypto";
import { Op } from "sequelize";
import db from "../models/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { appConfig } from "../config/env.js";
import SepayProvider from "../integrations/payment/sepayProvider.js";

const sepayProvider = new SepayProvider(appConfig.sepay);

/** Short, URL-safe order code. 10 chars => >10^15 entropy with base32 alphabet. */
function generateOrderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

function toPlanDto(plan) {
  if (!plan) return null;
  const json = plan.toJSON ? plan.toJSON() : plan;
  return {
    id: json.id,
    code: json.code,
    name: json.name,
    price: Number(json.price),
    currency: json.currency,
    durationDays: json.duration_days,
    features: Array.isArray(json.features) ? json.features : [],
    isActive: !!json.is_active,
  };
}

function toOrderDto(order) {
  if (!order) return null;
  const json = order.toJSON ? order.toJSON() : order;
  return {
    id: json.id,
    orderCode: json.order_code,
    provider: json.provider,
    status: json.status,
    amount: Number(json.amount),
    currency: json.currency,
    paymentContent: json.payment_content,
    qrUrl: json.qr_url || null,
    paymentUrl: json.payment_url || null,
    bankAccount: json.bank_account || null,
    bankName: json.bank_name || null,
    accountName: json.account_name || null,
    expiresAt: json.expires_at,
    paidAt: json.paid_at,
    plan: json.plan ? toPlanDto(json.plan) : undefined,
    createdAt: json.createdAt,
  };
}

function toSubscriptionDto(subscription) {
  if (!subscription) return null;
  const json = subscription.toJSON ? subscription.toJSON() : subscription;
  return {
    id: json.id,
    status: json.status,
    startedAt: json.started_at,
    expiresAt: json.expires_at,
    plan: json.plan ? toPlanDto(json.plan) : null,
  };
}

class BillingService {
  static get provider() {
    return sepayProvider;
  }

  static async listActivePlans() {
    const plans = await db.SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [["price", "ASC"]],
    });
    return plans.map(toPlanDto);
  }

  static async getPlanByCode(code) {
    if (!code) {
      throw new ValidationError("Mã gói không hợp lệ");
    }
    const plan = await db.SubscriptionPlan.findOne({ where: { code } });
    if (!plan) {
      throw new NotFoundError("Không tìm thấy gói đăng ký");
    }
    return plan;
  }

  static async getCurrentSubscription(userId) {
    const subscription = await db.UserSubscription.findOne({
      where: {
        user_id: userId,
        status: "active",
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: db.SubscriptionPlan, as: "plan" }],
      order: [["expires_at", "DESC"]],
    });
    return toSubscriptionDto(subscription);
  }

  static async createOrderForUser(user, planCode) {
    const plan = await this.getPlanByCode(planCode);

    if (!plan.is_active) {
      throw new ConflictError("Gói đăng ký hiện không khả dụng");
    }

    if (plan.code === "FREE" || Number(plan.price) <= 0) {
      throw new ValidationError("Không thể tạo đơn thanh toán cho gói miễn phí");
    }

    if (!appConfig.sepay.enabled) {
      throw new ConflictError(
        "Cổng thanh toán hiện chưa được bật. Vui lòng liên hệ quản trị viên.",
      );
    }

    const orderCode = generateOrderCode();
    const paymentContent = sepayProvider.buildPaymentContent(user.id, orderCode);
    const expiresAt = new Date(
      Date.now() + appConfig.sepay.orderTtlMinutes * 60 * 1000,
    );

    const instruction = sepayProvider.createPaymentInstruction({
      amount: Number(plan.price),
      paymentContent,
    });

    const order = await db.PaymentOrder.create({
      user_id: user.id,
      plan_id: plan.id,
      provider: instruction.provider,
      order_code: orderCode,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      payment_content: paymentContent,
      qr_url: instruction.qrUrl,
      payment_url: instruction.paymentUrl,
      bank_account: instruction.bankAccount,
      bank_name: instruction.bankName,
      account_name: instruction.accountName,
      expires_at: expiresAt,
    });

    return toOrderDto({
      ...order.toJSON(),
      plan: plan.toJSON(),
    });
  }

  static async getOrderForUser(userId, orderId) {
    const order = await db.PaymentOrder.findOne({
      where: { id: orderId },
      include: [{ model: db.SubscriptionPlan, as: "plan" }],
    });

    if (!order) {
      throw new NotFoundError("Không tìm thấy đơn thanh toán");
    }
    if (order.user_id !== userId) {
      throw new ForbiddenError("Bạn không có quyền xem đơn thanh toán này");
    }

    if (
      order.status === "pending" &&
      order.expires_at &&
      new Date(order.expires_at).getTime() < Date.now()
    ) {
      await order.update({ status: "expired" });
    }

    return toOrderDto(order);
  }

  /**
   * Process a Sepay webhook. Idempotent: relies on the unique (provider, provider_transaction_id)
   * constraint on payment_transaction so retried webhooks become a 200 no-op.
   *
   * Returns { handled: boolean, reason?: string } describing the outcome (caller responds 200 either way
   * for handled cases to avoid Sepay retries flooding us, but we mark order failed on amount mismatch).
   */
  static async handleSepayWebhook(req, payload = {}, rawBodyString = "") {
    if (!sepayProvider.verifyWebhook(req, rawBodyString)) {
      throw new ForbiddenError("Webhook signature không hợp lệ");
    }

    const parsed = sepayProvider.parseWebhook(payload);

    if (!parsed.providerTransactionId) {
      throw new ValidationError("Webhook thiếu provider_transaction_id");
    }

    if (!parsed.isIncoming) {
      return { handled: true, skipped: "not_incoming" };
    }

    const existing = await db.PaymentTransaction.findOne({
      where: {
        provider: parsed.provider,
        provider_transaction_id: parsed.providerTransactionId,
      },
    });
    if (existing) {
      return { handled: true, idempotent: true };
    }

    if (!parsed.paymentContent) {
      await this.#recordOrphanTransaction(parsed, null);
      return { handled: true, skipped: "no_payment_content" };
    }

    const order = await db.PaymentOrder.findOne({
      where: { payment_content: parsed.paymentContent },
      include: [{ model: db.SubscriptionPlan, as: "plan" }],
    });

    if (!order) {
      await this.#recordOrphanTransaction(parsed, null);
      return { handled: true, skipped: "order_not_found" };
    }

    if (order.status !== "pending") {
      await this.#recordOrphanTransaction(parsed, order.id);
      return { handled: true, skipped: `order_status_${order.status}` };
    }

    if (
      order.expires_at &&
      new Date(order.expires_at).getTime() < parsed.transactionTime.getTime()
    ) {
      await order.update({ status: "expired" });
      await this.#recordOrphanTransaction(parsed, order.id);
      return { handled: true, skipped: "order_expired" };
    }

    const paidAmt = Math.round(Number(parsed.amount));
    const expectedAmt = Math.round(Number(order.amount));
    if (paidAmt !== expectedAmt) {
      await order.update({
        status: "failed",
        raw_provider_data: parsed.raw,
      });
      await this.#recordOrphanTransaction(parsed, order.id);
      return { handled: true, skipped: "amount_mismatch" };
    }

    const transaction = await db.sequelize.transaction();
    try {
      await db.PaymentTransaction.create(
        {
          provider: parsed.provider,
          provider_transaction_id: parsed.providerTransactionId,
          payment_order_id: order.id,
          amount: parsed.amount,
          currency: parsed.currency,
          transaction_time: parsed.transactionTime,
          raw_payload: parsed.raw,
        },
        { transaction },
      );

      await order.update(
        {
          status: "paid",
          paid_at: parsed.transactionTime,
          raw_provider_data: parsed.raw,
        },
        { transaction },
      );

      const subscription = await this.#activateSubscription(order, transaction);

      await db.User.update(
        {
          subscription_tier: order.plan.code,
          subscription_expires_at: subscription.expires_at,
        },
        { where: { id: order.user_id }, transaction },
      );

      await transaction.commit();
      return { handled: true, activated: true };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Create or extend a user_subscription row. If user has an active subscription on the same plan,
   * extend its expires_at; otherwise mark old ones expired and start a new active row.
   */
  static async #activateSubscription(order, transaction) {
    const now = new Date();
    const durationMs = Number(order.plan.duration_days) * 24 * 60 * 60 * 1000;

    const existingActive = await db.UserSubscription.findOne({
      where: {
        user_id: order.user_id,
        plan_id: order.plan_id,
        status: "active",
        expires_at: { [Op.gt]: now },
      },
      transaction,
    });

    if (existingActive) {
      const baseExpiry = new Date(existingActive.expires_at);
      const newExpiry = new Date(baseExpiry.getTime() + durationMs);
      await existingActive.update(
        { expires_at: newExpiry, source_payment_order_id: order.id },
        { transaction },
      );
      return existingActive;
    }

    await db.UserSubscription.update(
      { status: "expired" },
      {
        where: {
          user_id: order.user_id,
          status: "active",
        },
        transaction,
      },
    );

    return db.UserSubscription.create(
      {
        user_id: order.user_id,
        plan_id: order.plan_id,
        status: "active",
        started_at: now,
        expires_at: new Date(now.getTime() + durationMs),
        source_payment_order_id: order.id,
      },
      { transaction },
    );
  }

  static async #recordOrphanTransaction(parsed, orderId) {
    try {
      await db.PaymentTransaction.create({
        provider: parsed.provider,
        provider_transaction_id: parsed.providerTransactionId,
        payment_order_id: orderId,
        amount: parsed.amount,
        currency: parsed.currency,
        transaction_time: parsed.transactionTime,
        raw_payload: parsed.raw,
      });
    } catch (error) {
      // Unique constraint => already recorded; safe to ignore.
      if (error?.name !== "SequelizeUniqueConstraintError") {
        throw error;
      }
    }
  }
}

export default BillingService;
