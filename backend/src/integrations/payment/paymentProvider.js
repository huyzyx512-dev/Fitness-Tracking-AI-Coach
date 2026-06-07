/**
 * Abstract base for any payment provider integration. Each provider must implement at least
 * `createPaymentInstruction` (returns bank/QR data shown to the user) and `parseWebhook`/`verifyWebhook`
 * (server-to-server callback handling).
 */
class PaymentProvider {
  // eslint-disable-next-line no-unused-vars
  async createPaymentInstruction(_payload) {
    throw new Error("createPaymentInstruction chưa được triển khai");
  }

  // eslint-disable-next-line no-unused-vars
  verifyWebhook(_req) {
    throw new Error("verifyWebhook chưa được triển khai");
  }

  // eslint-disable-next-line no-unused-vars
  parseWebhook(_payload) {
    throw new Error("parseWebhook chưa được triển khai");
  }

  // eslint-disable-next-line no-unused-vars
  buildPaymentContent(_userId, _orderCode) {
    throw new Error("buildPaymentContent chưa được triển khai");
  }
}

export default PaymentProvider;
