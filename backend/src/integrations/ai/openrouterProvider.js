import AIProvider from "./aiProvider.js";

class OpenRouterProvider extends AIProvider {
  constructor({
    apiKey = "",
    model = "openrouter/free",
    baseUrl = "https://openrouter.ai/api/v1",
    requestTimeoutMs = 30000,
    httpReferer = "",
    appTitle = "",
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.requestTimeoutMs = requestTimeoutMs;
    this.httpReferer = (httpReferer || "").trim();
    this.appTitle = (appTitle || "").trim();
  }

  _buildHeaders() {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.httpReferer) {
      headers["HTTP-Referer"] = this.httpReferer;
    }

    if (this.appTitle) {
      headers["X-OpenRouter-Title"] = this.appTitle;
    }

    return headers;
  }

  /**
   * Gọi OpenRouter Chat Completions (OpenAI-compatible).
   * Không log API key hoặc nội dung prompt đầy đủ.
   */
  async _callChatCompletions(messages, extraOptions = {}) {
    if (!this.apiKey) {
      throw new Error("AI_API_KEY chưa được cấu hình");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this._buildHeaders(),
        body: JSON.stringify({
          model: this.model,
          messages,
          ...extraOptions,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`AI request timeout sau ${this.requestTimeoutMs}ms`);
      }
      throw new Error(`AI provider network error: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let detail = `status ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.error?.message) {
          detail += `: ${errBody.error.message}`;
        }
      } catch {
        // ignore parse error khi đọc error body
      }
      throw new Error(`AI provider request failed với ${detail}`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("AI provider returned invalid JSON response");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned empty content");
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

  async askCoach({ message, context, userContext } = {}) {
    const systemPrompt = `Bạn là AI Fitness Coach trong app FitTrack.
Chỉ hỗ trợ thông tin về tập luyện, bài tập, lịch tập, và phục hồi cơ bản.
Không chẩn đoán y tế. Không tư vấn thuốc, steroid, hay chất cấm.
Nếu người dùng có dấu hiệu chấn thương hoặc bệnh lý nghiêm trọng, hãy khuyên họ gặp bác sĩ hoặc chuyên gia y tế.
Nếu câu hỏi không liên quan đến fitness, từ chối một cách nhẹ nhàng.
Trả lời bằng tiếng Việt nếu người dùng dùng tiếng Việt.`;

    const userParts = [];
    if (userContext) {
      userParts.push(`Thông tin người dùng: ${JSON.stringify(userContext)}`);
    }
    if (context) {
      userParts.push(`Ngữ cảnh: ${context}`);
    }
    userParts.push(message ?? "");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userParts.filter(Boolean).join("\n") },
    ];

    const { content, usage } = await this._callChatCompletions(messages);

    return {
      answer: content,
      usage,
      provider: "openrouter",
      model: this.model,
    };
  }

  async generateWorkoutPlan({ input, availableExercises, availableCategories, availableMuscleGroups, userContext } = {}) {
    const systemPrompt = `Bạn là AI Fitness Coach tạo kế hoạch tập luyện cho FitTrack.
Trả về JSON thuần túy theo đúng schema yêu cầu. Không dùng markdown. Không dùng code fence. Không thêm text nào ngoài JSON.
scheduledAt luôn là null. Không đặt lịch cụ thể.
Ưu tiên dùng exerciseId từ danh sách bài tập có sẵn nếu bài phù hợp. Nếu không có bài phù hợp, dùng exerciseId: null.
Không tự tạo nhóm cơ mới. Nếu không chắc nhóm cơ, dùng nhóm gần nhất hoặc Full Body.
Không tư vấn y tế. Không nutrition plan. Không progress insight. Không pose/video analysis.

Schema JSON output bắt buộc:
{
  "summary": "string",
  "goal": "muscle_gain | fat_loss | endurance | general_fitness | other",
  "daysPerWeek": 3,
  "sessionMinutes": 60,
  "level": "beginner | intermediate | advanced",
  "days": [
    {
      "dayIndex": 1,
      "title": "string",
      "focus": "string",
      "estimatedMinutes": 60,
      "scheduledAt": null,
      "exercises": [
        {
          "exerciseId": null,
          "name": "string",
          "description": "string",
          "category": "string",
          "primaryMuscleGroup": "string",
          "secondaryMuscleGroups": [],
          "difficultyLevel": "beginner | intermediate | advanced",
          "equipment": "string",
          "metValue": 5,
          "sets": 4,
          "reps": 10,
          "weight": 0,
          "restTimeSeconds": 90,
          "notes": "string"
        }
      ]
    }
  ]
}`;

    const userParts = [];
    if (userContext) {
      userParts.push(`Thông tin người dùng: ${JSON.stringify(userContext)}`);
    }
    if (availableCategories?.length) {
      userParts.push(`Danh mục có sẵn: ${availableCategories.map((c) => c.name).join(", ")}`);
    }
    if (availableMuscleGroups?.length) {
      userParts.push(`Nhóm cơ có sẵn: ${availableMuscleGroups.map((m) => m.name).join(", ")}`);
    }
    if (availableExercises?.length) {
      userParts.push(`Bài tập có sẵn (dùng exerciseId nếu phù hợp):\n${JSON.stringify(availableExercises)}`);
    }
    if (input) {
      userParts.push(`Yêu cầu: ${JSON.stringify(input)}`);
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userParts.filter(Boolean).join("\n\n") },
    ];

    const { content, usage } = await this._callChatCompletions(messages, {
      response_format: { type: "json_object" },
    });

    const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let plan;
    try {
      plan = JSON.parse(stripped);
    } catch {
      throw new Error("AI provider returned invalid JSON cho workout plan");
    }

    return {
      plan,
      usage,
      provider: "openrouter",
      model: this.model,
    };
  }
}

export default OpenRouterProvider;
