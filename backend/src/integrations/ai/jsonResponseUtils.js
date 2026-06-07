export function stripJsonCodeFence(content) {
  if (typeof content !== "string") {
    return "";
  }
  return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function createInvalidJsonError() {
  const error = new Error("AI generated invalid JSON for workout plan");
  error.code = "AI_INVALID_JSON_OUTPUT";
  return error;
}

export function parseJsonObjectContent(content) {
  const stripped = stripJsonCodeFence(content);

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw createInvalidJsonError();
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw createInvalidJsonError();
  }

  return parsed;
}

export const WORKOUT_PLAN_CORRECTIVE_USER_MESSAGE = {
  role: "user",
  content:
    "The previous response was not valid JSON. Return valid JSON only. Do not include markdown, code fences, comments, or explanatory text.",
};

/**
 * Gọi chat completions và parse JSON plan với retry tối đa 1 lần khi JSON invalid.
 * Không retry lỗi HTTP/network từ callChatCompletions.
 */
export async function requestWorkoutPlanJson(
  callChatCompletions,
  messages,
  extraOptions,
  providerName,
  model,
) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const callMessages =
      attempt === 1 ? messages : [...messages, WORKOUT_PLAN_CORRECTIVE_USER_MESSAGE];

    const { content, usage } = await callChatCompletions(callMessages, extraOptions);

    try {
      const plan = parseJsonObjectContent(content);
      return { plan, usage, provider: providerName, model };
    } catch (err) {
      if (err?.code !== "AI_INVALID_JSON_OUTPUT" || attempt === 2) {
        if (attempt === 2 && err?.code === "AI_INVALID_JSON_OUTPUT") {
          console.warn("[AI] generateWorkoutPlan invalid JSON output", {
            provider: providerName,
            attempt: 2,
          });
        }
        throw err;
      }
    }
  }

  throw createInvalidJsonError();
}
