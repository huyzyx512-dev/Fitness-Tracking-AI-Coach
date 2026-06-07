export const LOG_TRUNCATE_MAX = 300;

export class AIProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AIProviderError";
    this.provider = options.provider || "unknown";
    this.status = options.status;
    this.code = options.code || "AI_PROVIDER_ERROR";
    this.publicMessage =
      options.publicMessage || "Không thể xử lý yêu cầu AI lúc này.";
    this.retryable = Boolean(options.retryable);
    this.retryAfter = options.retryAfter;
    this.details = options.details;
  }
}

export function truncateForLog(value, max = LOG_TRUNCATE_MAX) {
  if (value == null) return "";
  const str = String(value);
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}

/**
 * Trích message ngắn từ body lỗi provider (JSON hoặc text thuần).
 * Không trả về body dài — caller nên truncate thêm nếu cần.
 */
export function extractProviderErrorMessage(bodyText) {
  if (!bodyText || typeof bodyText !== "string") return null;

  const trimmed = bodyText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const err = parsed?.error;
      if (err && typeof err === "object") {
        if (typeof err.message === "string" && err.message.trim()) {
          return truncateForLog(err.message.trim(), 200);
        }
        if (typeof err.code === "string" && err.code.trim()) {
          return truncateForLog(err.code.trim(), 100);
        }
      }
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        return truncateForLog(parsed.message.trim(), 200);
      }
    } catch {
      // fall through to plain text
    }
  }

  return truncateForLog(trimmed, 200);
}

function readRetryAfter(response) {
  const raw = response?.headers?.get?.("Retry-After");
  if (raw == null || raw === "") return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  const asNumber = Number(trimmed);
  return Number.isFinite(asNumber) ? asNumber : trimmed;
}

const HTTP_ERROR_MAP = {
  401: {
    code: "AI_PROVIDER_UNAUTHORIZED",
    publicMessage:
      "AI provider API key không hợp lệ hoặc chưa được cấp quyền.",
  },
  402: {
    code: "AI_PROVIDER_INSUFFICIENT_CREDITS",
    publicMessage: "AI provider thiếu credit/balance để xử lý yêu cầu.",
  },
  429: {
    code: "AI_PROVIDER_RATE_LIMITED",
    publicMessage:
      "AI provider đang bị giới hạn tần suất hoặc đã hết quota tạm thời.",
    retryable: false,
  },
  502: {
    code: "AI_PROVIDER_BAD_GATEWAY",
    publicMessage:
      "Model AI hiện không khả dụng hoặc provider trả phản hồi không hợp lệ.",
  },
  503: {
    code: "AI_PROVIDER_UNAVAILABLE",
    publicMessage: "AI provider hiện không khả dụng, vui lòng thử lại sau.",
  },
};

function mapHttpStatus(status) {
  if (HTTP_ERROR_MAP[status]) {
    return HTTP_ERROR_MAP[status];
  }
  if (status >= 500) {
    return {
      code: "AI_PROVIDER_SERVER_ERROR",
      publicMessage: "AI provider đang gặp sự cố tạm thời.",
    };
  }
  if (status >= 400) {
    return {
      code: "AI_PROVIDER_CLIENT_ERROR",
      publicMessage: "Yêu cầu AI không hợp lệ hoặc bị provider từ chối.",
    };
  }
  return {
    code: "AI_PROVIDER_ERROR",
    publicMessage: "Không thể xử lý yêu cầu AI lúc này.",
  };
}

export function createMissingApiKeyError(provider) {
  return new AIProviderError(`[${provider}] AI API key is missing`, {
    provider,
    code: "AI_MISSING_API_KEY",
    publicMessage: "AI chưa được cấu hình API key.",
  });
}

export function createTimeoutError(provider, requestTimeoutMs) {
  return new AIProviderError(
    `[${provider}] AI request timeout after ${requestTimeoutMs}ms`,
    {
      provider,
      code: "AI_PROVIDER_TIMEOUT",
      publicMessage:
        "Không thể kết nối tới AI provider hoặc request quá thời gian.",
    },
  );
}

export function createNetworkError(provider, causeMessage) {
  const safeCause = truncateForLog(causeMessage, 120);
  return new AIProviderError(`[${provider}] AI provider network error: ${safeCause}`, {
    provider,
    code: "AI_PROVIDER_NETWORK_ERROR",
    publicMessage:
      "Không thể kết nối tới AI provider hoặc request quá thời gian.",
    details: safeCause ? { cause: safeCause } : undefined,
  });
}

export function createInvalidSuccessBodyError(provider, reason) {
  return new AIProviderError(`[${provider}] ${reason}`, {
    provider,
    code: "AI_PROVIDER_BAD_GATEWAY",
    publicMessage:
      "Model AI hiện không khả dụng hoặc provider trả phản hồi không hợp lệ.",
  });
}

export async function throwHttpProviderError(provider, response) {
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch {
    bodyText = "";
  }

  const providerMessage = extractProviderErrorMessage(bodyText);
  const truncatedBody = truncateForLog(bodyText);
  const mapped = mapHttpStatus(response.status);
  const retryAfter =
    response.status === 429 || response.status === 503
      ? readRetryAfter(response)
      : undefined;

  const internalMessage = providerMessage
    ? `[${provider}] HTTP ${response.status}: ${providerMessage}`
    : `[${provider}] HTTP ${response.status}`;

  throw new AIProviderError(internalMessage, {
    provider,
    status: response.status,
    code: mapped.code,
    publicMessage: mapped.publicMessage,
    retryable: mapped.retryable ?? false,
    retryAfter,
    details: {
      providerMessage: providerMessage || undefined,
      bodyPreview: truncatedBody || undefined,
    },
  });
}
