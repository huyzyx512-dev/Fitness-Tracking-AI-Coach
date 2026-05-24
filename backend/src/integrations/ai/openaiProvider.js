import AIProvider from "./aiProvider.js";
import { requestWorkoutPlanJson } from "./jsonResponseUtils.js";
import { executeChatCompletionsRequest } from "./providerCallUtils.js";

class OpenAIProvider extends AIProvider {
  constructor({ apiKey = "", model = "gpt-4o-mini", baseUrl = "https://api.openai.com/v1", requestTimeoutMs = 30000 } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.requestTimeoutMs = requestTimeoutMs;
  }

  /**
   * Gọi OpenAI-compatible Chat Completions endpoint.
   * Không log API key hoặc nội dung prompt đầy đủ.
   */
  async _callChatCompletions(messages, extraOptions = {}) {
    return executeChatCompletionsRequest({
      provider: "openai",
      apiKey: this.apiKey,
      url: `${this.baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: {
        model: this.model,
        messages,
        ...extraOptions,
      },
      requestTimeoutMs: this.requestTimeoutMs,
    });
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
      provider: "openai",
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

    return requestWorkoutPlanJson(
      (callMessages, extraOptions) => this._callChatCompletions(callMessages, extraOptions),
      messages,
      {
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      "openai",
      this.model,
    );
  }
}

export default OpenAIProvider;
