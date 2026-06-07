import crypto from "node:crypto";
import PaymentProvider from "./paymentProvider.js";

/**
 * Sepay (sepay.vn) payment provider.
 *
 * Webhook payload (JSON) — see https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook
 *
 * Auth modes (dashboard → Webhook → Security):
 * - **HMAC-SHA256** (recommended): headers `X-SePay-Signature`, `X-SePay-Timestamp`; body must be verified
 *   against the **raw** bytes (use `express.raw` on the webhook route only).
 * - **API Key**: `Authorization: Apikey <SEPAY_WEBHOOK_SECRET>`
 *
 * Response contract: HTTP 200/201 with JSON body exactly `{"success": true}` — see billingController.
 */
class SepayProvider extends PaymentProvider {
  constructor({
    enabled = false,
    webhookSecret,
    bankAccount,
    bankName,
    accountName,
    qrTemplate,
  } = {}) {
    super();
    this.providerName = "sepay";
    this.enabled = enabled;
    this.webhookSecret = webhookSecret || undefined;
    this.bankAccount = bankAccount || undefined;
    this.bankName = bankName || undefined;
    this.accountName = accountName || undefined;
    this.qrTemplate = qrTemplate || undefined;
  }

  buildPaymentContent(_userId, orderCode) {
    return `FT${String(orderCode || "").toUpperCase()}`;
  }

  /**
   * Returns the bank/QR info shown to the user. Pure function — does not call Sepay API.
   * (Sepay model is "user transfers to your bank, Sepay forwards webhook" — no order pre-creation needed.)
   */
  createPaymentInstruction({ amount, paymentContent }) {
    const qrUrl = this.#buildQrUrl(amount, paymentContent);
    return {
      provider: this.providerName,
      bankAccount: this.bankAccount,
      bankName: this.bankName,
      accountName: this.accountName,
      qrUrl,
      paymentUrl: undefined,
    };
  }

  /**
   * @param {import('express').Request} req
   * @param {string} rawBodyString — exact UTF-8 string Sepay signed (required for HMAC)
   */
  verifyWebhook(req, rawBodyString = "") {
    const secret = this.webhookSecret;
    if (!secret) {
      return false;
    }

    const sigHeader =
      req.headers["x-sepay-signature"] ??
      req.headers["X-SePay-Signature"];
    const tsHeader =
      req.headers["x-sepay-timestamp"] ??
      req.headers["X-SePay-Timestamp"];

    /** HMAC-SHA256: signature = HMAC(secret, `${timestamp}.${rawBody}`), header `sha256=<hex>` */
    if (sigHeader) {
      if (!rawBodyString) {
        return false;
      }
      const timestamp = Number(tsHeader);
      if (!Number.isFinite(timestamp)) {
        return false;
      }
      const skewSec = Math.abs(Date.now() / 1000 - timestamp);
      if (skewSec > 300) {
        return false;
      }
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBodyString}`).digest("hex");
      const sig = Buffer.from(String(sigHeader).trim(), "utf8");
      const exp = Buffer.from(expected, "utf8");
      try {
        return sig.length === exp.length && crypto.timingSafeEqual(sig, exp);
      } catch {
        return false;
      }
    }

    /** API Key */
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (!header || typeof header !== "string") {
      return false;
    }

    const trimmed = header.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith("apikey ")) {
      return trimmed.slice(7).trim() === secret;
    }
    if (lower.startsWith("bearer ")) {
      return trimmed.slice(7).trim() === secret;
    }
    return trimmed === secret;
  }

  parseWebhook(payload = {}) {
    const transferType = String(payload.transferType || payload.type || "").toLowerCase();
    const amount = Number(
      payload.transferAmount ?? payload.amount ?? payload.transfer_amount ?? 0,
    );
    const content = String(
      payload.content ?? payload.description ?? payload.transaction_content ?? "",
    );
    const codeField = payload.code != null && payload.code !== "" ? String(payload.code) : "";
    const mergedForMatch = [content, codeField].filter(Boolean).join(" ");

    const providerTransactionId = String(
      payload.id ?? payload.transactionId ?? payload.referenceCode ?? "",
    );
    const transactionTimeRaw =
      payload.transactionDate || payload.transaction_date || payload.transactionTime;
    const transactionTime = transactionTimeRaw ? new Date(transactionTimeRaw) : new Date();

    return {
      provider: this.providerName,
      providerTransactionId,
      isIncoming: transferType === "" || transferType === "in",
      amount: Number.isFinite(amount) ? amount : 0,
      currency: "VND",
      content,
      paymentContent: this.#extractPaymentContent(mergedForMatch),
      transactionTime,
      raw: payload,
    };
  }

  #extractPaymentContent(text) {
    if (!text) return undefined;
    const cleaned = String(text).toUpperCase();
    const match = cleaned.match(/FT[A-Z0-9]{4,}/);
    return match ? match[0] : undefined;
  }

  #buildQrUrl(amount, paymentContent) {
    if (!this.qrTemplate) return undefined;
    return this.qrTemplate
      .replace(/\{amount\}/gi, String(amount))
      .replace(/\{content\}/gi, encodeURIComponent(paymentContent));
  }
}

export default SepayProvider;
