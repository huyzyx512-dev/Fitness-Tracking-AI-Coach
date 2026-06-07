import assert from "node:assert/strict";
import { buildRefreshTokenCookieOptions } from "../src/config/env.js";
import { parseSchema } from "../src/validators/common.js";
import { exerciseSchema } from "../src/validators/exerciseValidator.js";
import { registerSchema } from "../src/validators/authValidator.js";
import {
  WORKOUT_STATUS,
  assertCanCompleteWorkout,
  assertCanStartWorkout,
} from "../src/utils/workoutStatus.js";
import OpenRouterProvider from "../src/integrations/ai/openrouterProvider.js";
import OpenAIProvider from "../src/integrations/ai/openaiProvider.js";
import { createAIProvider } from "../src/integrations/ai/aiProviderFactory.js";
import { AIProviderError } from "../src/integrations/ai/aiProviderError.js";
import {
  parseJsonObjectContent,
  stripJsonCodeFence,
} from "../src/integrations/ai/jsonResponseUtils.js";

const MINIMAL_WORKOUT_PLAN = {
  summary: "Test plan",
  goal: "general_fitness",
  daysPerWeek: 3,
  sessionMinutes: 60,
  level: "beginner",
  days: [],
};

function buildChatCompletionResponse(content) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };
}

async function withMockFetch(responses, fn) {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    const body = responses[callCount];
    if (body === undefined) {
      throw new Error(`Unexpected fetch call #${callCount + 1}`);
    }
    callCount += 1;
    return {
      ok: true,
      async json() {
        return body;
      },
    };
  };

  try {
    const result = await fn();
    return { result, callCount };
  } catch (error) {
    error.callCount = callCount;
    throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function buildHttpErrorResponse(status, { body, headers = {} } = {}) {
  const bodyText =
    typeof body === "string" ? body : JSON.stringify(body ?? { error: { message: "error" } });
  return {
    ok: false,
    status,
    headers: {
      get(name) {
        const key = Object.keys(headers).find(
          (h) => h.toLowerCase() === String(name).toLowerCase(),
        );
        return key ? headers[key] : null;
      },
    },
    async json() {
      return JSON.parse(bodyText);
    },
    async text() {
      return bodyText;
    },
  };
}

async function withMockHttpResponses(responses, fn) {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    const spec = responses[callCount];
    if (spec === undefined) {
      throw new Error(`Unexpected fetch call #${callCount + 1}`);
    }
    callCount += 1;
    if (typeof spec === "function") {
      return spec();
    }
    if (spec.ok === false || spec.status >= 400) {
      return buildHttpErrorResponse(spec.status ?? 500, spec);
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      async json() {
        return spec.json ?? spec;
      },
      async text() {
        return JSON.stringify(spec.json ?? spec);
      },
    };
  };

  try {
    const result = await fn();
    return { result, callCount };
  } catch (error) {
    error.callCount = callCount;
    throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function withMockFetchCapture(responseBody, fn) {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  let lastRequest = null;

  globalThis.fetch = async (url, init) => {
    callCount += 1;
    lastRequest = { url, init };
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      async json() {
        return responseBody;
      },
      async text() {
        return JSON.stringify(responseBody);
      },
    };
  };

  try {
    const result = await fn();
    return { result, callCount, lastRequest };
  } catch (error) {
    error.callCount = callCount;
    error.lastRequest = lastRequest;
    throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function assertNoFetchOnRun(fn) {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };
  try {
    fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalled, false);
}

function assertNoSecretsInError(error) {
  const serialized = `${error.message} ${error.publicMessage ?? ""} ${JSON.stringify(error.details ?? {})}`;
  assert.ok(!/Bearer\s+/i.test(serialized));
  assert.ok(!/sk-[a-z0-9]/i.test(serialized));
  assert.ok(!serialized.includes("test-key-used-in-headers"));
}

const tests = [
  {
    name: "tùy chọn cookie bao gồm các trường bảo mật cơ bản",
    run: () => {
      const options = buildRefreshTokenCookieOptions(1000);
      assert.equal(options.httpOnly, true);
      assert.equal(options.maxAge, 1000);
      assert.equal(options.path, "/");
    },
  },
  {
    name: "schema đăng ký chuẩn hóa email",
    run: () => {
      const payload = parseSchema(registerSchema, {
        email: "USER@Example.COM",
        password: "123456",
        name: "Demo User",
        birthday: "2000-01-01",
        height: 170,
        weight: 70,
        gender: "khác", // Đã đổi thành "khác" để khớp với schema đã Việt hóa
      });

      assert.equal(payload.email, "user@example.com");
    },
  },
  {
    name: "schema bài tập yêu cầu payload đã được chuẩn hóa",
    run: () => {
      const payload = parseSchema(exerciseSchema, {
        name: "Bench Press",
        description: "Chest exercise",
        category_id: 1,
        muscle_group_ids: [1, 2],
        difficulty_level: "intermediate",
        equipment: "Barbell",
        met_value: 5,
        video_url: "https://example.com/video",
        thumbnail_url: "https://example.com/image",
      });

      assert.deepEqual(payload.muscle_group_ids, [1, 2]);
      assert.equal(payload.category_id, 1);
    },
  },
  {
    name: "bài tập đang chờ (pending) có thể bắt đầu",
    run: () => {
      assert.doesNotThrow(() => assertCanStartWorkout(WORKOUT_STATUS.PENDING));
    },
  },
  {
    name: "bài tập đang chờ (pending) không thể hoàn thành",
    run: () => {
      assert.throws(() => assertCanCompleteWorkout(WORKOUT_STATUS.PENDING));
    },
  },
  {
    name: "bài tập đang diễn ra (in progress) không thể bắt đầu hai lần",
    run: () => {
      assert.throws(() => assertCanStartWorkout(WORKOUT_STATUS.IN_PROGRESS));
    },
  },
  {
    name: "jsonResponseUtils parse plain JSON object",
    run: () => {
      const parsed = parseJsonObjectContent(JSON.stringify(MINIMAL_WORKOUT_PLAN));
      assert.equal(parsed.summary, "Test plan");
      assert.equal(stripJsonCodeFence("  {\"a\":1}  "), "{\"a\":1}");
    },
  },
  {
    name: "createAIProvider disabled trả null, không gọi fetch",
    run: () => {
      assertNoFetchOnRun(() => {
        const provider = createAIProvider({
          enabled: false,
          provider: "openrouter",
          apiKey: "dummy-openrouter-key",
        });
        assert.equal(provider, null);
      });
    },
  },
  {
    name: "createAIProvider openrouter tạo OpenRouterProvider",
    run: () => {
      assertNoFetchOnRun(() => {
        const provider = createAIProvider({
          enabled: true,
          provider: "openrouter",
          apiKey: "dummy-openrouter-key",
          model: "openrouter/free",
          baseUrl: "https://openrouter.ai/api/v1",
          requestTimeoutMs: 30000,
          openRouter: { httpReferer: "", appTitle: "" },
        });
        assert.ok(provider instanceof OpenRouterProvider);
      });
    },
  },
  {
    name: "createAIProvider openai tạo OpenAIProvider",
    run: () => {
      assertNoFetchOnRun(() => {
        const provider = createAIProvider({
          enabled: true,
          provider: "openai",
          apiKey: "dummy-openai-key",
          model: "gpt-4o-mini",
          baseUrl: "https://api.openai.com/v1",
          requestTimeoutMs: 30000,
        });
        assert.ok(provider instanceof OpenAIProvider);
      });
    },
  },
  {
    name: "createAIProvider unsupported provider throw rõ",
    run: () => {
      assertNoFetchOnRun(() => {
        assert.throws(
          () =>
            createAIProvider({
              enabled: true,
              provider: "unsupported-test-provider",
              apiKey: "dummy",
            }),
          (err) => {
            assert.match(err.message, /không được hỗ trợ/);
            assert.match(err.message, /unsupported-test-provider/);
            return true;
          },
        );
      });
    },
  },
  {
    name: "generateWorkoutPlan valid JSON không retry",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key", model: "openrouter/free" });
      const { result, callCount } = await withMockFetch(
        [buildChatCompletionResponse(JSON.stringify(MINIMAL_WORKOUT_PLAN))],
        () => provider.generateWorkoutPlan({ input: { goal: "general_fitness" } }),
      );

      assert.equal(callCount, 1);
      assert.equal(result.provider, "openrouter");
      assert.equal(result.model, "openrouter/free");
      assert.deepEqual(result.plan.summary, "Test plan");
      assert.equal(result.usage.totalTokens, 30);
    },
  },
  {
    name: "generateWorkoutPlan invalid JSON lần 1, valid JSON lần 2",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key", model: "openrouter/free" });
      const { result, callCount } = await withMockFetch(
        [
          buildChatCompletionResponse("Here is your plan:\n```json\n{ broken\n```"),
          buildChatCompletionResponse(JSON.stringify(MINIMAL_WORKOUT_PLAN)),
        ],
        () => provider.generateWorkoutPlan({ input: { goal: "general_fitness" } }),
      );

      assert.equal(callCount, 2);
      assert.equal(result.provider, "openrouter");
      assert.equal(result.model, "openrouter/free");
      assert.deepEqual(result.plan.goal, "general_fitness");
      assert.ok(result.usage);
    },
  },
  {
    name: "OpenRouter missing API key chỉ lỗi khi gọi AI",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "" });
      const originalFetch = globalThis.fetch;
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        throw new Error("fetch should not be called");
      };
      try {
        await assert.rejects(
          () => provider.askCoach({ message: "hello" }),
          (err) => {
            assert.ok(err instanceof AIProviderError);
            assert.equal(err.code, "AI_MISSING_API_KEY");
            assert.equal(err.provider, "openrouter");
            assertNoSecretsInError(err);
            return true;
          },
        );
        assert.equal(fetchCalled, false);
      } finally {
        globalThis.fetch = originalFetch;
      }
      assert.doesNotThrow(() => new OpenAIProvider({ apiKey: "" }));
    },
  },
  {
    name: "OpenRouter HTTP 401 maps AI_PROVIDER_UNAUTHORIZED",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key-used-in-headers" });
      let thrown;
      try {
        await withMockHttpResponses(
          [
            {
              ok: false,
              status: 401,
              body: { error: { message: "Invalid API key" } },
            },
          ],
          () => provider.askCoach({ message: "hello" }),
        );
        assert.fail("expected 401 to throw");
      } catch (error) {
        thrown = error;
      }
      assert.equal(thrown.callCount, 1);
      assert.ok(thrown instanceof AIProviderError);
      assert.equal(thrown.code, "AI_PROVIDER_UNAUTHORIZED");
      assert.equal(thrown.status, 401);
      assert.match(thrown.message, /401/);
      assertNoSecretsInError(thrown);
    },
  },
  {
    name: "OpenRouter HTTP 402 maps AI_PROVIDER_INSUFFICIENT_CREDITS",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key-used-in-headers" });
      let thrown;
      try {
        await withMockHttpResponses(
          [{ ok: false, status: 402, body: { error: { message: "Insufficient credits" } } }],
          () => provider.askCoach({ message: "hello" }),
        );
        assert.fail("expected 402 to throw");
      } catch (error) {
        thrown = error;
      }
      assert.equal(thrown.code, "AI_PROVIDER_INSUFFICIENT_CREDITS");
      assert.equal(thrown.status, 402);
      assert.equal(thrown.callCount, 1);
    },
  },
  {
    name: "OpenRouter HTTP 429 không retry, có retryAfter",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key-used-in-headers" });
      let thrown;
      try {
        await withMockHttpResponses(
          [
            {
              ok: false,
              status: 429,
              headers: { "Retry-After": "60" },
              body: { error: { message: "Rate limit exceeded" } },
            },
          ],
          () => provider.askCoach({ message: "hello" }),
        );
        assert.fail("expected 429 to throw");
      } catch (error) {
        thrown = error;
      }
      assert.equal(thrown.callCount, 1);
      assert.equal(thrown.code, "AI_PROVIDER_RATE_LIMITED");
      assert.equal(thrown.retryAfter, 60);
      assert.equal(thrown.retryable, false);
      assertNoSecretsInError(thrown);
    },
  },
  {
    name: "OpenRouter askCoach mock fetch success trả provider/model đúng",
    run: async () => {
      const provider = new OpenRouterProvider({
        apiKey: "test-key",
        model: "openrouter/test-model",
        baseUrl: "https://openrouter.ai/api/v1",
      });
      const mockResponse = {
        choices: [{ message: { content: "Xin chào" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        model: "openrouter/test-model",
      };
      const { result, callCount, lastRequest } = await withMockFetchCapture(mockResponse, () =>
        provider.askCoach({ message: "hello" }),
      );

      assert.equal(callCount, 1);
      assert.equal(result.answer, "Xin chào");
      assert.equal(result.provider, "openrouter");
      assert.equal(result.model, "openrouter/test-model");
      assert.equal(lastRequest.url, "https://openrouter.ai/api/v1/chat/completions");
      assert.equal(lastRequest.init.method, "POST");
      assert.equal(lastRequest.init.headers.Authorization, "Bearer test-key");
      assert.equal(lastRequest.init.headers["Content-Type"], "application/json");
    },
  },
  {
    name: "OpenRouter gửi attribution headers khi có httpReferer và appTitle",
    run: async () => {
      const provider = new OpenRouterProvider({
        apiKey: "test-key",
        model: "openrouter/test-model",
        httpReferer: "https://fittrack.example.com",
        appTitle: "FitTrack Test",
      });
      const mockResponse = {
        choices: [{ message: { content: "OK" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };
      const { callCount, lastRequest } = await withMockFetchCapture(mockResponse, () =>
        provider.askCoach({ message: "hello" }),
      );

      assert.equal(callCount, 1);
      assert.equal(lastRequest.init.headers["HTTP-Referer"], "https://fittrack.example.com");
      assert.equal(lastRequest.init.headers["X-OpenRouter-Title"], "FitTrack Test");
    },
  },
  {
    name: "OpenRouter không gửi attribution headers rỗng",
    run: async () => {
      const provider = new OpenRouterProvider({
        apiKey: "test-key",
        httpReferer: "",
        appTitle: "",
      });
      const mockResponse = {
        choices: [{ message: { content: "OK" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };
      const { lastRequest } = await withMockFetchCapture(mockResponse, () =>
        provider.askCoach({ message: "hello" }),
      );

      assert.ok(!("HTTP-Referer" in lastRequest.init.headers));
      assert.ok(!("X-OpenRouter-Title" in lastRequest.init.headers));
    },
  },
  {
    name: "OpenRouter HTTP 503 maps AI_PROVIDER_UNAVAILABLE",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key-used-in-headers" });
      let thrown;
      try {
        await withMockHttpResponses(
          [{ ok: false, status: 503, body: { error: { message: "No provider available" } } }],
          () => provider.askCoach({ message: "hello" }),
        );
        assert.fail("expected 503 to throw");
      } catch (error) {
        thrown = error;
      }
      assert.equal(thrown.callCount, 1);
      assert.equal(thrown.code, "AI_PROVIDER_UNAVAILABLE");
      assert.equal(thrown.status, 503);
    },
  },
  {
    name: "OpenRouter HTTP 500 body dài bị truncate trong details",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key-used-in-headers" });
      const longBody = "x".repeat(2000);
      let thrown;
      try {
        await withMockHttpResponses(
          [{ ok: false, status: 500, body: longBody }],
          () => provider.askCoach({ message: "hello" }),
        );
        assert.fail("expected 500 to throw");
      } catch (error) {
        thrown = error;
      }
      assert.equal(thrown.code, "AI_PROVIDER_SERVER_ERROR");
      assert.ok(thrown.details?.bodyPreview);
      assert.ok(thrown.details.bodyPreview.length <= 301);
      assert.ok(!thrown.message.includes(longBody));
      assert.ok(!thrown.details.bodyPreview.includes("x".repeat(500)));
    },
  },
  {
    name: "generateWorkoutPlan invalid JSON cả 2 lần throw lỗi ngắn",
    run: async () => {
      const provider = new OpenRouterProvider({ apiKey: "test-key", model: "openrouter/free" });
      const invalidContent = `INVALID_JSON_PAYLOAD_${"x".repeat(500)}`;

      let thrown;
      try {
        await withMockFetch(
          [
            buildChatCompletionResponse(invalidContent),
            buildChatCompletionResponse(invalidContent),
          ],
          () => provider.generateWorkoutPlan({ input: { goal: "general_fitness" } }),
        );
        assert.fail("expected generateWorkoutPlan to throw");
      } catch (error) {
        thrown = error;
      }

      assert.equal(thrown.callCount, 2);
      assert.equal(thrown.message, "AI generated invalid JSON for workout plan");
      assert.ok(thrown.message.length < 100);
      assert.ok(!thrown.message.includes(invalidContent));
    },
  },
];

let passed = 0;

for (const test of tests) {
  try {
    await test.run();
    passed += 1;
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    console.error(`FAIL: ${test.name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error(`${passed}/${tests.length} bài test đã vượt qua`);
} else {
  console.log(`${passed}/${tests.length} bài test đã vượt qua`);
}