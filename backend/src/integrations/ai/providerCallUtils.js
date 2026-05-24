import {
  AIProviderError,
  createInvalidSuccessBodyError,
  createMissingApiKeyError,
  createNetworkError,
  createTimeoutError,
  throwHttpProviderError,
} from "./aiProviderError.js";

/**
 * Xử lý response Chat Completions thành công (HTTP 200).
 * Throw AIProviderError khi body/choices/content không hợp lệ.
 */
export async function parseChatCompletionSuccess(provider, response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw createInvalidSuccessBodyError(
      provider,
      "AI provider returned invalid JSON response",
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw createInvalidSuccessBodyError(
      provider,
      "AI provider returned empty content",
    );
  }

  const usage = data.usage
    ? {
        inputTokens: data.usage.prompt_tokens ?? null,
        outputTokens: data.usage.completion_tokens ?? null,
        totalTokens: data.usage.total_tokens ?? null,
      }
    : null;

  return { content, usage };
}

/**
 * Gọi fetch Chat Completions với timeout; map lỗi sang AIProviderError.
 * Không log API key, Authorization, messages.
 */
export async function executeChatCompletionsRequest({
  provider,
  apiKey,
  url,
  headers,
  body,
  requestTimeoutMs,
}) {
  if (!apiKey) {
    throw createMissingApiKeyError(provider);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof AIProviderError) {
      throw err;
    }
    if (err?.name === "AbortError") {
      throw createTimeoutError(provider, requestTimeoutMs);
    }
    throw createNetworkError(provider, err?.message);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    await throwHttpProviderError(provider, response);
  }

  return parseChatCompletionSuccess(provider, response);
}
