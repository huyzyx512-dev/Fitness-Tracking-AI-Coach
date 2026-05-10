import asyncHandler from "../middlewares/asyncHandler.js";
import {
  createNewExercise,
  deleteExerciseById,
  getAllExercises,
  getExerciseById,
  updateExerciseVideoAfterUpload,
  updateInfoExercise,
  mapDifficultyForApi,
} from "../services/exerciseService.js";
import { publicUrlForUploadRelativePath } from "../utils/publicUrl.js";
import { ValidationError } from "../errors/AppError.js";
import { parseSchema } from "../validators/common.js";
import {
  exerciseSchema,
  exerciseUpdateSchema,
} from "../validators/exerciseValidator.js";

const normalizeExerciseForApi = (exercise) => {
  const json = exercise?.toJSON ? exercise.toJSON() : exercise;
  if (!json) return json;
  return {
    ...json,
    difficulty_level: mapDifficultyForApi(json.difficulty_level),
  };
};

export const getExercises = asyncHandler(async (req, res) => {
  // #region agent log
  fetch("http://127.0.0.1:7445/ingest/70e58504-4a0e-4545-83fa-9766f0b089ff", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "54b982" }, body: JSON.stringify({ sessionId: "54b982", runId: "pre-fix", hypothesisId: "H1", location: "exerciseController.js:getExercises:entry", message: "Incoming exercise filter query", data: { muscle_group_ids: req.query?.muscle_group_ids ?? null, muscle_match: req.query?.muscle_match ?? null }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  const rawMuscleGroupIds = String(req.query.muscle_group_ids || "").trim();
  const muscleGroupIds = rawMuscleGroupIds
    ? rawMuscleGroupIds
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];

  if (rawMuscleGroupIds && muscleGroupIds.length === 0) {
    throw new ValidationError("muscle_group_ids không hợp lệ");
  }

  const muscleMatch = req.query.muscle_match === "all" ? "all" : "any";
  // #region agent log
  fetch("http://127.0.0.1:7445/ingest/70e58504-4a0e-4545-83fa-9766f0b089ff", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "54b982" }, body: JSON.stringify({ sessionId: "54b982", runId: "pre-fix", hypothesisId: "H1", location: "exerciseController.js:getExercises:parsed", message: "Parsed exercise filter payload", data: { rawMuscleGroupIds, muscleGroupIds, muscleMatch }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  const exercises = await getAllExercises({
    muscleGroupIds,
    muscleMatch,
  });
  return res.status(200).json({ exercises: exercises.map(normalizeExerciseForApi) });
});

export const getExercise = asyncHandler(async (req, res) => {
  const exercise = await getExerciseById(req.params.id);
  return res.status(200).json({ exercise: normalizeExerciseForApi(exercise) });
});

export const uploadExerciseVideoController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError("Vui lòng gửi file video (trường 'video').");
  }
  const relativePath = `exercises/${req.file.filename}`;
  const publicUrl = publicUrlForUploadRelativePath(req, relativePath);
  const exercise = await updateExerciseVideoAfterUpload(req.params.id, req.user, publicUrl);
  return res.status(200).json({ exercise: normalizeExerciseForApi(exercise) });
});

export const createExercise = asyncHandler(async (req, res) => {
  const payload = parseSchema(exerciseSchema, req.body);
  const exercise = await createNewExercise(payload, req.user.id);
  return res.status(201).json({ exercise: normalizeExerciseForApi(exercise) });
});

export const updateExercise = asyncHandler(async (req, res) => {
  const payload = parseSchema(exerciseUpdateSchema, req.body);
  const exercise = await updateInfoExercise(req.params.id, payload, req.user);
  return res.status(200).json({ exercise: normalizeExerciseForApi(exercise) });
});

export const deleteExercise = asyncHandler(async (req, res) => {
  await deleteExerciseById(req.params.id, req.user);
  return res.sendStatus(204);
});
