import db from "../models/index.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { createAIProvider } from "../integrations/ai/aiProviderFactory.js";
import { AIProviderError, truncateForLog } from "../integrations/ai/aiProviderError.js";
import { WORKOUT_STATUS } from "../utils/workoutStatus.js";

const AVAILABLE_EXERCISES_LIMIT = 120;
const RECOMMENDATION_LIST_LIMIT = 50;
const ERROR_MESSAGE_MAX_LENGTH = 2000;
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_GOALS = ["muscle_gain", "fat_loss", "endurance", "general_fitness", "other"];

/**
 * Bản đồ đồng nghĩa nhóm cơ: key là chuỗi đã normalize (strip dấu + lowercase),
 * value là tên muscle group chuẩn (PascalCase) khớp với seed DB hiện có.
 */
const MUSCLE_SYNONYMS = {
  chest: "Chest",
  "upper chest": "Chest",
  "lower chest": "Chest",
  nguc: "Chest",
  back: "Back",
  lats: "Back",
  latissimus: "Back",
  traps: "Back",
  lung: "Back",
  shoulder: "Shoulders",
  shoulders: "Shoulders",
  delts: "Shoulders",
  deltoids: "Shoulders",
  vai: "Shoulders",
  biceps: "Biceps",
  "tay truoc": "Biceps",
  triceps: "Triceps",
  "tay sau": "Triceps",
  quadriceps: "Quadriceps",
  quads: "Quadriceps",
  "dui truoc": "Quadriceps",
  hamstrings: "Hamstrings",
  "dui sau": "Hamstrings",
  glutes: "Glutes",
  mong: "Glutes",
  core: "Core",
  abs: "Core",
  abdominal: "Core",
  bung: "Core",
  calves: "Calves",
  "bap chan": "Calves",
  forearms: "Forearms",
  "cang tay": "Forearms",
  "full body": "Full Body",
  "toan than": "Full Body",
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Lấy tối đa `max` ký tự từ error message để tránh log quá dài */
function truncateError(err) {
  const msg = err?.message || String(err);
  return msg.slice(0, ERROR_MESSAGE_MAX_LENGTH);
}

function logProviderFailure(context, err) {
  if (err instanceof AIProviderError) {
    console.error(`[AI] ${context} failed`, {
      provider: err.provider,
      status: err.status,
      code: err.code,
      retryAfter: err.retryAfter,
      providerMessage: err.details?.providerMessage,
    });
    return;
  }
  console.error(`[AI] ${context} failed`, {
    message: truncateForLog(err?.message || String(err), 300),
  });
}

function formatErrorForDb(err) {
  if (err instanceof AIProviderError) {
    const parts = [`[${err.code}]`, err.message];
    if (err.retryAfter != null) {
      parts.push(`retryAfter=${err.retryAfter}`);
    }
    return truncateError({ message: parts.join(" ") });
  }
  return truncateError(err);
}

function mapProviderErrorToAppError(err) {
  if (err instanceof AIProviderError) {
    const statusCode =
      err.code === "AI_PROVIDER_UNAVAILABLE" || err.code === "AI_PROVIDER_RATE_LIMITED"
        ? 503
        : 502;
    return new AppError(err.publicMessage, statusCode);
  }
  return new AppError("Không thể xử lý yêu cầu AI lúc này", 502);
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
// Apply helpers
// ---------------------------------------------------------------------------

/** Chuẩn hoá tên bài tập: strip dấu + lowercase + collapse khoảng trắng. */
function normalizeExerciseName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tìm category id phù hợp; fallback category đầu tiên. Không tạo mới ở MVP. */
function resolveCategoryId(categoryName, categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new AppError(
      "Hệ thống chưa có danh mục bài tập để gán cho bài tập mới do AI tạo",
      500,
    );
  }

  const target = normalizeExerciseName(categoryName);
  if (target) {
    const exact = categories.find(
      (c) => normalizeExerciseName(c.name) === target,
    );
    if (exact) return exact.id;
  }

  const strength = categories.find(
    (c) => normalizeExerciseName(c.name) === "strength training",
  );
  if (strength) return strength.id;

  return categories[0].id;
}

/** Tìm muscle group id; thử exact → synonym → fallback Full Body → first. */
function resolveMuscleGroupId(muscleName, muscleGroups) {
  if (!Array.isArray(muscleGroups) || muscleGroups.length === 0) {
    throw new AppError(
      "Hệ thống chưa có nhóm cơ để gán cho bài tập mới do AI tạo",
      500,
    );
  }

  const target = normalizeExerciseName(muscleName);
  if (target) {
    const exact = muscleGroups.find(
      (m) => normalizeExerciseName(m.name) === target,
    );
    if (exact) return exact.id;

    const synonymName = MUSCLE_SYNONYMS[target];
    if (synonymName) {
      const syn = muscleGroups.find((m) => m.name === synonymName);
      if (syn) return syn.id;
    }
  }

  const fullBody = muscleGroups.find(
    (m) => normalizeExerciseName(m.name) === "full body",
  );
  if (fullBody) return fullBody.id;

  return muscleGroups[0].id;
}

/**
 * Tạo Exercise mới ở dạng ai_generated + sync ExerciseMuscle theo primary/secondary.
 * Caller phải truyền transaction và bộ cache categories/muscleGroups đã load 1 lần.
 */
async function createAiGeneratedExercise(
  aiExercise,
  { categories, muscleGroups },
  transaction,
) {
  const rawName = typeof aiExercise.name === "string" ? aiExercise.name.trim() : "";
  if (!rawName) {
    throw new ValidationError("Bài tập do AI tạo thiếu tên");
  }
  const name = rawName.slice(0, 255);
  const normalized = normalizeExerciseName(name);

  const description = typeof aiExercise.description === "string"
    ? aiExercise.description.slice(0, 5000)
    : "";

  const difficulty = VALID_LEVELS.includes(aiExercise.difficultyLevel)
    ? aiExercise.difficultyLevel
    : "beginner";

  const equipment = (typeof aiExercise.equipment === "string" && aiExercise.equipment.trim())
    ? aiExercise.equipment.trim().slice(0, 100)
    : "none";

  const metRaw = Number(aiExercise.metValue);
  const metValue = Number.isFinite(metRaw) && metRaw > 0 ? metRaw : 3.0;

  const categoryId = resolveCategoryId(aiExercise.category, categories);

  const exercise = await db.Exercise.create(
    {
      name,
      description,
      category_id: categoryId,
      difficulty_level: difficulty,
      equipment,
      met_value: metValue,
      normalized_name: normalized,
      source_type: "ai_generated",
      is_verified: false,
      created_by: null,
    },
    { transaction },
  );

  const primaryId = resolveMuscleGroupId(aiExercise.primaryMuscleGroup, muscleGroups);
  const secondaryRaw = Array.isArray(aiExercise.secondaryMuscleGroups)
    ? aiExercise.secondaryMuscleGroups
    : [];
  const secondaryIds = [...new Set(
    secondaryRaw
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => resolveMuscleGroupId(s, muscleGroups))
      .filter((id) => id !== primaryId),
  )];

  const muscleRows = [
    { exercise_id: exercise.id, muscle_group_id: primaryId, is_primary: true },
    ...secondaryIds.map((mid) => ({
      exercise_id: exercise.id,
      muscle_group_id: mid,
      is_primary: false,
    })),
  ];

  await db.ExerciseMuscle.bulkCreate(muscleRows, { transaction });

  return exercise;
}

/**
 * Resolve toàn bộ bài tập trong các day đã chọn → trả Map<"dayIndex_exIdx", exerciseId>.
 *
 * Thuật toán hạn chế N+1:
 * 1. Bulk findAll theo tập exerciseId hợp lệ.
 * 2. Bulk findAll theo tập normalized_name (gồm cả phiên bản strip-dấu và lowercase-trim
 *    để khớp dữ liệu backfill cũ "LOWER(TRIM(name))" + dữ liệu mới có strip dấu).
 * 3. Còn lại mới create Exercise mới ai_generated.
 */
async function resolveExercisesForApply(
  selectedDays,
  { categories, muscleGroups },
  transaction,
) {
  const idCandidates = new Set();
  const nameCandidates = new Set();

  for (const day of selectedDays) {
    for (const ex of day.exercises) {
      if (Number.isInteger(ex.exerciseId) && ex.exerciseId > 0) {
        idCandidates.add(ex.exerciseId);
      }
      if (typeof ex.name === "string" && ex.name.trim()) {
        const trimmed = ex.name.trim();
        const normalized = normalizeExerciseName(trimmed);
        const lower = trimmed.toLowerCase();
        if (normalized) nameCandidates.add(normalized);
        if (lower && lower !== normalized) nameCandidates.add(lower);
      }
    }
  }

  const Op = db.Sequelize.Op;
  const idMap = new Map();
  if (idCandidates.size > 0) {
    const rows = await db.Exercise.findAll({
      where: { id: { [Op.in]: Array.from(idCandidates) } },
      attributes: ["id", "name", "normalized_name"],
      transaction,
    });
    for (const r of rows) idMap.set(r.id, r);
  }

  const nameMap = new Map();
  if (nameCandidates.size > 0) {
    const rows = await db.Exercise.findAll({
      where: { normalized_name: { [Op.in]: Array.from(nameCandidates) } },
      attributes: ["id", "name", "normalized_name"],
      transaction,
    });
    for (const r of rows) {
      if (r.normalized_name && !nameMap.has(r.normalized_name)) {
        nameMap.set(r.normalized_name, r);
      }
    }
  }

  const resolved = new Map();

  for (const day of selectedDays) {
    for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
      const ex = day.exercises[exIdx];
      const key = `${day.dayIndex}_${exIdx}`;

      if (
        Number.isInteger(ex.exerciseId) &&
        ex.exerciseId > 0 &&
        idMap.has(ex.exerciseId)
      ) {
        resolved.set(key, idMap.get(ex.exerciseId).id);
        continue;
      }

      const rawName = typeof ex.name === "string" ? ex.name.trim() : "";
      if (rawName) {
        const normalized = normalizeExerciseName(rawName);
        const lower = rawName.toLowerCase();
        const match =
          (normalized && nameMap.get(normalized)) || nameMap.get(lower);
        if (match) {
          resolved.set(key, match.id);
          continue;
        }
      }

      if (!rawName) {
        throw new ValidationError(
          `Ngày tập ${day.dayIndex} có bài tập thiếu tên hoặc exerciseId không hợp lệ`,
        );
      }

      const created = await createAiGeneratedExercise(
        ex,
        { categories, muscleGroups },
        transaction,
      );
      if (created.normalized_name) {
        nameMap.set(created.normalized_name, created);
      }
      idMap.set(created.id, created);
      resolved.set(key, created.id);
    }
  }

  return resolved;
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
      logProviderFailure("askCoach", err);

      try {
        await db.AiRequestLog.create({
          user_id: userId,
          type: "ask",
          input: sanitizedInput,
          output: null,
          status: "failed",
          provider: err instanceof AIProviderError ? err.provider : null,
          model: null,
          input_tokens: null,
          output_tokens: null,
          error_message: formatErrorForDb(err),
        });
      } catch {
        console.error("Lỗi lưu ai_request_log", err);
      }
      throw mapProviderErrorToAppError(err);
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
      console.error("Lỗi lưu log thành công", err);
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
      logProviderFailure("generateWorkoutPlan", err);

      try {
        await db.AiRequestLog.create({
          user_id: userId,
          type: "workout_plan",
          input: sanitizedInput,
          output: null,
          status: "failed",
          provider: err instanceof AIProviderError ? err.provider : null,
          model: null,
          input_tokens: null,
          output_tokens: null,
          error_message: formatErrorForDb(err),
        });
      } catch {
        // Lỗi log không được che lỗi gốc
      }
      throw mapProviderErrorToAppError(err);
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

  // -------------------------------------------------------------------------
  // applyRecommendation
  // -------------------------------------------------------------------------

  /**
   * Áp dụng các ngày được chọn trong recommendation thành nhiều Workout thật.
   * Toàn bộ thao tác (tạo Exercise mới nếu cần, tạo Workout, tạo WorkoutExercise,
   * cập nhật trạng thái recommendation) chạy trong cùng 1 Sequelize transaction.
   */
  async applyRecommendation(userId, recommendationId, payload) {
    if (!userId) throw new AppError("userId là bắt buộc", 400);
    if (!Number.isInteger(recommendationId) || recommendationId <= 0) {
      throw new AppError("recommendationId là bắt buộc", 400);
    }
    if (!payload || typeof payload !== "object") {
      throw new AppError("payload là bắt buộc", 400);
    }

    const selectedDayIndexes = payload.selectedDayIndexes;
    if (!Array.isArray(selectedDayIndexes) || selectedDayIndexes.length === 0) {
      throw new ValidationError("Vui lòng chọn ít nhất 1 ngày tập để áp dụng");
    }

    const transaction = await db.sequelize.transaction();

    try {
      // Lock recommendation row để tránh race condition apply 2 lần
      const rec = await db.AiWorkoutRecommendation.findOne({
        where: { id: recommendationId, user_id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!rec) {
        throw new NotFoundError("Không tìm thấy recommendation");
      }

      if (rec.status !== "draft") {
        throw new ConflictError(
          "Recommendation này đã được áp dụng trước đó hoặc không còn ở trạng thái draft",
        );
      }

      const plan =
        payload.editedPlan && Array.isArray(payload.editedPlan.days)
          ? payload.editedPlan
          : rec.generated_plan;

      if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
        throw new ValidationError("Kế hoạch không có ngày tập để áp dụng");
      }

      const selectedSet = new Set(selectedDayIndexes);
      const selectedDays = plan.days.filter(
        (d) => d && selectedSet.has(d.dayIndex),
      );

      if (selectedDays.length === 0) {
        throw new ValidationError(
          "Không có ngày tập nào khớp với selectedDayIndexes",
        );
      }

      for (const d of selectedDays) {
        if (!Array.isArray(d.exercises) || d.exercises.length === 0) {
          throw new ValidationError(
            `Ngày tập ${d.dayIndex} không có bài tập để áp dụng`,
          );
        }
      }

      // Load categories + muscleGroups 1 lần (chỉ cần khi tạo Exercise mới,
      // nhưng load trước để resolveExercisesForApply không phải fetch lại N+1)
      const [categories, muscleGroups] = await Promise.all([
        db.Category.findAll({
          attributes: ["id", "name"],
          transaction,
        }),
        db.MuscleGroup.findAll({
          attributes: ["id", "name"],
          transaction,
        }),
      ]);

      const categoriesData = categories.map((c) => c.toJSON());
      const muscleGroupsData = muscleGroups.map((m) => m.toJSON());

      const resolved = await resolveExercisesForApply(
        selectedDays,
        { categories: categoriesData, muscleGroups: muscleGroupsData },
        transaction,
      );

      const planSummary = typeof plan.summary === "string"
        ? plan.summary.slice(0, 200)
        : "";

      const workoutIds = [];

      for (const day of selectedDays) {
        const rawTitle = typeof day.title === "string" ? day.title.trim() : "";
        const title = (rawTitle ? rawTitle : `AI Workout Day ${day.dayIndex}`).slice(0, 200);

        const focus = typeof day.focus === "string" ? day.focus.slice(0, 200) : "";
        const notesParts = [];
        if (planSummary) notesParts.push(`Tóm tắt: ${planSummary}`);
        if (focus) notesParts.push(`Trọng tâm: ${focus}`);
        const notes = notesParts.join("\n") || "Kế hoạch tập do AI tạo";

        const workout = await db.Workout.create(
          {
            user_id: userId,
            title,
            notes,
            scheduled_at: null,
            status: WORKOUT_STATUS.PENDING,
          },
          { transaction },
        );

        // Dedupe theo exercise_id trong cùng day: giữ item đầu tiên
        const seenExerciseIds = new Set();
        const workoutExerciseRows = [];

        for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
          const aiEx = day.exercises[exIdx];
          const key = `${day.dayIndex}_${exIdx}`;
          const exerciseId = resolved.get(key);
          if (!exerciseId) continue;
          if (seenExerciseIds.has(exerciseId)) continue;
          seenExerciseIds.add(exerciseId);

          const weightRaw = Number(aiEx?.weight);
          workoutExerciseRows.push({
            workout_id: workout.id,
            exercise_id: exerciseId,
            sets: clampInt(aiEx?.sets, 1, 10, 3),
            reps: clampInt(aiEx?.reps, 1, 100, 10),
            weight: Math.max(0, Number.isFinite(weightRaw) ? weightRaw : 0),
            comment: typeof aiEx?.notes === "string"
              ? aiEx.notes.slice(0, 1000)
              : "",
            rest_time_seconds: clampInt(aiEx?.restTimeSeconds, 0, 600, 60),
            order_index: workoutExerciseRows.length,
          });
        }

        if (workoutExerciseRows.length === 0) {
          throw new ValidationError(
            `Ngày tập ${day.dayIndex} không có bài tập hợp lệ sau khi xử lý`,
          );
        }

        await db.WorkoutExercise.bulkCreate(workoutExerciseRows, { transaction });
        workoutIds.push(workout.id);
      }

      rec.status = "applied";
      rec.applied_at = new Date();
      await rec.save({ transaction });

      await transaction.commit();

      return {
        message: "Áp dụng kế hoạch AI thành công",
        workoutIds,
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /** Ngoài scope MVP — không dùng */
  async generateProgressInsights() {
    throw new Error("generateProgressInsights ngoài scope MVP");
  }
}

export default AIRecommendationService;
