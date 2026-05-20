import db from "../models/index.js";
import { AppError, NotFoundError } from "../errors/AppError.js";
import { createAIProvider } from "../integrations/ai/aiProviderFactory.js";

const AVAILABLE_EXERCISES_LIMIT = 120;
const RECOMMENDATION_LIST_LIMIT = 50;
const ERROR_MESSAGE_MAX_LENGTH = 2000;
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_GOALS = ["muscle_gain", "fat_loss", "endurance", "general_fitness", "other"];

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Lấy tối đa `max` ký tự từ error message để tránh log quá dài */
function truncateError(err) {
  const msg = err?.message || String(err);
  return msg.slice(0, ERROR_MESSAGE_MAX_LENGTH);
}

/** Sanitize payload trước khi lưu log — loại bỏ field có thể nhạy cảm */
function sanitizeInputForLog(payload) {
  if (!payload || typeof payload !== "object") return {};
  const { message, goal, daysPerWeek, sessionMinutes, level, equipment, context } = payload;
  const result = {};
  if (message !== undefined) result.message = typeof message === "string" ? message.slice(0, 500) : message;
  if (goal !== undefined) result.goal = goal;
  if (daysPerWeek !== undefined) result.daysPerWeek = daysPerWeek;
  if (sessionMinutes !== undefined) result.sessionMinutes = sessionMinutes;
  if (level !== undefined) result.level = level;
  if (equipment !== undefined) result.equipment = equipment;
  if (context !== undefined && typeof context === "string") result.context = context.slice(0, 200);
  return result;
}

function clampInt(val, min, max, def) {
  const n = Number(val);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sanitizeExercise(exercise, index, fallbackLevel) {
  if (!exercise || typeof exercise !== "object") {
    throw new AppError(`Bài tập tại index ${index} không hợp lệ`, 502);
  }
  const name = typeof exercise.name === "string" && exercise.name.trim()
    ? exercise.name.trim()
    : null;
  if (!name) {
    throw new AppError(`Bài tập tại index ${index} thiếu tên`, 502);
  }

  const safeLevel = VALID_LEVELS.includes(exercise.difficultyLevel)
    ? exercise.difficultyLevel
    : (VALID_LEVELS.includes(fallbackLevel) ? fallbackLevel : "beginner");

  const metRaw = Number(exercise.metValue);

  return {
    exerciseId: Number.isInteger(exercise.exerciseId) && exercise.exerciseId > 0
      ? exercise.exerciseId
      : null,
    name,
    description: typeof exercise.description === "string" ? exercise.description : "",
    category: typeof exercise.category === "string" ? exercise.category : "",
    primaryMuscleGroup: typeof exercise.primaryMuscleGroup === "string" && exercise.primaryMuscleGroup.trim()
      ? exercise.primaryMuscleGroup.trim()
      : "Full Body",
    secondaryMuscleGroups: Array.isArray(exercise.secondaryMuscleGroups)
      ? exercise.secondaryMuscleGroups.filter((s) => typeof s === "string")
      : [],
    difficultyLevel: safeLevel,
    equipment: typeof exercise.equipment === "string" ? exercise.equipment : "",
    metValue: Number.isFinite(metRaw) && metRaw > 0 ? metRaw : 3,
    sets: clampInt(exercise.sets, 1, 10, 3),
    reps: clampInt(exercise.reps, 1, 100, 10),
    weight: Math.max(0, Number.isFinite(Number(exercise.weight)) ? Number(exercise.weight) : 0),
    restTimeSeconds: clampInt(exercise.restTimeSeconds, 0, 600, 60),
    notes: typeof exercise.notes === "string" ? exercise.notes : "",
  };
}

function sanitizeDay(day, index, fallbackSessionMinutes, fallbackLevel) {
  if (!day || typeof day !== "object") {
    throw new AppError(`Day tại index ${index} không hợp lệ`, 502);
  }

  const dayIndex = Number.isInteger(day.dayIndex) && day.dayIndex > 0
    ? day.dayIndex
    : (index + 1);
  const title = typeof day.title === "string" && day.title.trim()
    ? day.title.trim()
    : `AI Workout Day ${dayIndex}`;
  const focus = typeof day.focus === "string" ? day.focus : "";
  const estMins = Number(day.estimatedMinutes);
  const estimatedMinutes = Number.isFinite(estMins) && estMins > 0
    ? Math.round(estMins)
    : fallbackSessionMinutes;

  if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
    throw new AppError(`Day ${dayIndex} không có bài tập`, 502);
  }

  const exercises = day.exercises.map((ex, exIdx) =>
    sanitizeExercise(ex, exIdx, fallbackLevel)
  );

  return {
    dayIndex,
    title,
    focus,
    estimatedMinutes,
    scheduledAt: null,
    exercises,
  };
}

/**
 * Sanitize raw plan từ provider.
 * Provider trả { plan, usage, provider, model } → gọi với rawPlan = providerResult.plan
 */
function sanitizeGeneratedPlan(rawPlan, fallbackInput) {
  if (!rawPlan || typeof rawPlan !== "object") {
    throw new AppError("AI trả về kế hoạch không hợp lệ", 502);
  }

  const goal = VALID_GOALS.includes(rawPlan.goal)
    ? rawPlan.goal
    : (VALID_GOALS.includes(fallbackInput?.goal) ? fallbackInput.goal : "other");
  const level = VALID_LEVELS.includes(rawPlan.level)
    ? rawPlan.level
    : (VALID_LEVELS.includes(fallbackInput?.level) ? fallbackInput.level : "beginner");

  const daysRaw = Number(rawPlan.daysPerWeek);
  const daysPerWeek = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.round(daysRaw)
    : (Number.isFinite(Number(fallbackInput?.daysPerWeek)) ? Math.round(Number(fallbackInput.daysPerWeek)) : 3);

  const minsRaw = Number(rawPlan.sessionMinutes);
  const sessionMinutes = Number.isFinite(minsRaw) && minsRaw > 0
    ? Math.round(minsRaw)
    : (Number.isFinite(Number(fallbackInput?.sessionMinutes)) ? Math.round(Number(fallbackInput.sessionMinutes)) : 60);

  const summary = typeof rawPlan.summary === "string" ? rawPlan.summary : "";

  if (!Array.isArray(rawPlan.days) || rawPlan.days.length === 0) {
    throw new AppError("AI trả về kế hoạch không có ngày tập", 502);
  }

  const days = rawPlan.days.map((day, idx) =>
    sanitizeDay(day, idx, sessionMinutes, level)
  );

  return { summary, goal, daysPerWeek, sessionMinutes, level, days };
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class AIRecommendationService {
  /**
   * @param {{ aiProvider?: import('../integrations/ai/aiProvider.js').default }} options
   */
  constructor({ aiProvider } = {}) {
    this.aiProvider = aiProvider !== undefined ? aiProvider : createAIProvider();
  }

  _guardProvider() {
    if (!this.aiProvider) {
      throw new AppError("AI tạm thời không khả dụng", 503);
    }
    if (
      typeof this.aiProvider.askCoach !== "function" ||
      typeof this.aiProvider.generateWorkoutPlan !== "function"
    ) {
      throw new AppError("AI provider chưa được cấu hình đúng", 503);
    }
  }

  // -------------------------------------------------------------------------
  // askCoach
  // -------------------------------------------------------------------------

  async askCoach(userId, payload) {
    if (!userId) throw new AppError("userId là bắt buộc", 400);
    if (!payload || typeof payload !== "object") throw new AppError("payload là bắt buộc", 400);

    const message = payload.message;
    if (typeof message !== "string" || !message.trim()) {
      throw new AppError("message là bắt buộc", 400);
    }

    this._guardProvider();

    // Tùy chọn load profile user nếu client yêu cầu
    let userContext;
    if (payload.context?.includeProfile === true) {
      try {
        const user = await db.User.findByPk(userId, {
          attributes: ["id", "weight", "height", "gender", "date_of_birth"],
        });
        if (user) {
          userContext = {
            weight: user.weight,
            height: user.height,
            gender: user.gender,
            dateOfBirth: user.date_of_birth,
          };
        }
      } catch {
        // userContext optional — bỏ qua lỗi, tiếp tục gọi AI
      }
    }

    const sanitizedInput = sanitizeInputForLog(payload);

    let providerResult;
    try {
      providerResult = await this.aiProvider.askCoach({
        message: message.trim(),
        context: typeof payload.context === "string" ? payload.context : undefined,
        userContext,
      });
    } catch (err) {
      try {
        await db.AiRequestLog.create({
          user_id: userId,
          type: "ask",
          input: sanitizedInput,
          output: null,
          status: "failed",
          provider: null,
          model: null,
          input_tokens: null,
          output_tokens: null,
          error_message: truncateError(err),
        });
      } catch {
        // Lỗi log không được che lỗi gốc
      }
      throw new AppError("Không thể xử lý yêu cầu AI lúc này", 502);
    }

    // Lưu log thành công
    try {
      await db.AiRequestLog.create({
        user_id: userId,
        type: "ask",
        input: sanitizedInput,
        output: { answer: typeof providerResult.answer === "string" ? providerResult.answer.slice(0, 5000) : "" },
        status: "success",
        provider: providerResult.provider ?? null,
        model: providerResult.model ?? null,
        input_tokens: providerResult.usage?.inputTokens ?? null,
        output_tokens: providerResult.usage?.outputTokens ?? null,
        error_message: null,
      });
    } catch {
      // Log thất bại không làm mất kết quả AI
    }

    return {
      answer: providerResult.answer,
      usage: providerResult.usage,
    };
  }

  // -------------------------------------------------------------------------
  // generateWorkoutPlan
  // -------------------------------------------------------------------------

  async generateWorkoutPlan(userId, payload) {
    if (!userId) throw new AppError("userId là bắt buộc", 400);
    if (!payload || typeof payload !== "object") throw new AppError("payload là bắt buộc", 400);

    this._guardProvider();

    const sanitizedInput = sanitizeInputForLog(payload);

    // Load dữ liệu có giới hạn — không load toàn bộ bảng
    const [availableExercises, availableCategories, availableMuscleGroups] =
      await Promise.all([
        db.Exercise.findAll({
          attributes: [
            "id", "name", "normalized_name", "category_id",
            "difficulty_level", "equipment", "met_value",
            "source_type", "is_verified",
          ],
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["id", "name"],
            },
            {
              model: db.MuscleGroup,
              as: "muscleGroups",
              attributes: ["id", "name"],
              through: { attributes: ["is_primary"] },
            },
          ],
          order: [
            ["is_verified", "DESC"],
            ["source_type", "ASC"],
            ["name", "ASC"],
          ],
          limit: AVAILABLE_EXERCISES_LIMIT,
        }),
        db.Category.findAll({
          attributes: ["id", "name"],
          order: [["name", "ASC"]],
        }),
        db.MuscleGroup.findAll({
          attributes: ["id", "name"],
          order: [["name", "ASC"]],
        }),
      ]);

    // User context tùy chọn
    let userContext;
    try {
      const user = await db.User.findByPk(userId, {
        attributes: ["id", "weight", "height", "gender", "date_of_birth"],
      });
      if (user) {
        userContext = {
          weight: user.weight,
          height: user.height,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
        };
      }
    } catch {
      // userContext optional
    }

    // Gọi AI provider
    let providerResult;
    try {
      providerResult = await this.aiProvider.generateWorkoutPlan({
        input: payload,
        availableExercises: availableExercises.map((e) => e.toJSON()),
        availableCategories: availableCategories.map((c) => c.toJSON()),
        availableMuscleGroups: availableMuscleGroups.map((m) => m.toJSON()),
        userContext,
      });
    } catch (err) {
      try {
        await db.AiRequestLog.create({
          user_id: userId,
          type: "workout_plan",
          input: sanitizedInput,
          output: null,
          status: "failed",
          provider: null,
          model: null,
          input_tokens: null,
          output_tokens: null,
          error_message: truncateError(err),
        });
      } catch {
        // Lỗi log không được che lỗi gốc
      }
      throw new AppError("Không thể xử lý yêu cầu AI lúc này", 502);
    }

    // Sanitize plan — throw controlled error nếu plan invalid
    let sanitizedPlan;
    try {
      sanitizedPlan = sanitizeGeneratedPlan(providerResult.plan, payload);
    } catch (err) {
      try {
        await db.AiRequestLog.create({
          user_id: userId,
          type: "workout_plan",
          input: sanitizedInput,
          output: null,
          status: "failed",
          provider: providerResult.provider ?? null,
          model: providerResult.model ?? null,
          input_tokens: providerResult.usage?.inputTokens ?? null,
          output_tokens: providerResult.usage?.outputTokens ?? null,
          error_message: truncateError(err),
        });
      } catch {
        // ignore
      }
      // Rethrow nếu đã là AppError, không re-wrap
      throw err instanceof AppError ? err : new AppError("Kế hoạch AI không hợp lệ", 502);
    }

    // Lưu request log thành công (chỉ summary, không lưu toàn bộ plan lớn)
    try {
      await db.AiRequestLog.create({
        user_id: userId,
        type: "workout_plan",
        input: sanitizedInput,
        output: {
          summary: sanitizedPlan.summary,
          goal: sanitizedPlan.goal,
          daysPerWeek: sanitizedPlan.daysPerWeek,
          dayCount: sanitizedPlan.days.length,
        },
        status: "success",
        provider: providerResult.provider ?? null,
        model: providerResult.model ?? null,
        input_tokens: providerResult.usage?.inputTokens ?? null,
        output_tokens: providerResult.usage?.outputTokens ?? null,
        error_message: null,
      });
    } catch {
      // Log thất bại — tiếp tục lưu recommendation
    }

    // Lưu recommendation draft
    let recommendation;
    try {
      recommendation = await db.AiWorkoutRecommendation.create({
        user_id: userId,
        goal: sanitizedPlan.goal || payload.goal || "other",
        days_per_week: sanitizedPlan.daysPerWeek || payload.daysPerWeek || 3,
        session_minutes: sanitizedPlan.sessionMinutes || payload.sessionMinutes || 60,
        level: sanitizedPlan.level || payload.level || "beginner",
        equipment: payload.equipment || sanitizedPlan.equipment || [],
        generated_plan: sanitizedPlan,
        status: "draft",
        applied_at: null,
      });
    } catch {
      // Rủi ro: AI gọi thành công nhưng lưu recommendation thất bại — không retry ở MVP
      throw new AppError("Không thể lưu kế hoạch tập AI lúc này", 500);
    }

    return {
      recommendationId: recommendation.id,
      plan: sanitizedPlan,
      usage: providerResult.usage,
    };
  }

  // -------------------------------------------------------------------------
  // getRecommendations
  // -------------------------------------------------------------------------

  async getRecommendations(userId) {
    if (!userId) throw new AppError("userId là bắt buộc", 400);

    const rows = await db.AiWorkoutRecommendation.findAll({
      where: { user_id: userId },
      attributes: [
        "id", "goal", "days_per_week", "session_minutes",
        "level", "equipment", "status", "applied_at",
        "createdAt", "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: RECOMMENDATION_LIST_LIMIT,
    });

    return rows.map((r) => ({
      id: r.id,
      goal: r.goal,
      daysPerWeek: r.days_per_week,
      sessionMinutes: r.session_minutes,
      level: r.level,
      equipment: r.equipment,
      status: r.status,
      appliedAt: r.applied_at,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  // -------------------------------------------------------------------------
  // getRecommendationDetail
  // -------------------------------------------------------------------------

  async getRecommendationDetail(userId, recommendationId) {
    if (!userId) throw new AppError("userId là bắt buộc", 400);
    if (!recommendationId) throw new AppError("recommendationId là bắt buộc", 400);

    const rec = await db.AiWorkoutRecommendation.findOne({
      where: { id: recommendationId, user_id: userId },
    });

    if (!rec) {
      throw new NotFoundError("Không tìm thấy recommendation");
    }

    return {
      id: rec.id,
      goal: rec.goal,
      daysPerWeek: rec.days_per_week,
      sessionMinutes: rec.session_minutes,
      level: rec.level,
      equipment: rec.equipment,
      generatedPlan: rec.generated_plan,
      status: rec.status,
      appliedAt: rec.applied_at,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
  }

  /** Ngoài scope MVP — không dùng */
  async generateProgressInsights() {
    throw new Error("generateProgressInsights ngoài scope MVP");
  }
}

export default AIRecommendationService;
