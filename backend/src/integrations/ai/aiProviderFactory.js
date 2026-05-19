import { aiConfig } from "../../config/env.js";
import OpenAIProvider from "./openaiProvider.js";

/**
 * Tạo AI provider từ config.
 * Trả về null nếu AI disabled — caller tự xử lý trường hợp null.
 * Không gọi network, không validate API key ở đây.
 *
 * @param {typeof aiConfig} config
 * @returns {import('./aiProvider.js').default | null}
 */
export function createAIProvider(config = aiConfig) {
  if (!config.enabled) {
    return null;
  }

  if (config.provider === "openai") {
    return new OpenAIProvider({
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      requestTimeoutMs: config.requestTimeoutMs,
    });
  }

  throw new Error(`AI provider không được hỗ trợ: ${config.provider}`);
}
