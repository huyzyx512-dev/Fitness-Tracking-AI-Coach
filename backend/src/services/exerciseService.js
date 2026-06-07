import fs from "fs";
import path from "path";
import db from "../models/index.js";
import { appConfig } from "../config/env.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { WORKOUT_STATUS } from "../utils/workoutStatus.js";

const DIFFICULTY_VI_TO_EN = {
  "cơ bản": "beginner",
  "trung bình": "intermediate",
  "nâng cao": "advanced",
};

const DIFFICULTY_EN_TO_VI = {
  beginner: "cơ bản",
  intermediate: "trung bình",
  advanced: "nâng cao",
};

export const mapDifficultyForDb = (viValue) =>
  DIFFICULTY_VI_TO_EN[viValue] || "beginner";

export const mapDifficultyForApi = (enValue) =>
  DIFFICULTY_EN_TO_VI[enValue] || "cơ bản";

const normalizeOptionalUrl = (value) => {
  if (value === "" || value === undefined) return null;
  return value;
};

const exerciseInclude = [
  {
    model: db.Category,
    as: "category",
    attributes: ["id", "name", "description"],
  },
  {
    model: db.MuscleGroup,
    as: "muscleGroups",
    through: { attributes: ["is_primary"] },
    attributes: ["id", "name"],
  },
  {
    model: db.User,
    as: "creator",
    attributes: ["id", "name", "email"],
  },
];

const assertExercisePermission = (exercise, user) => {
  if (exercise.created_by !== user.id && user.role?.name !== "ADMIN") {
    throw new ForbiddenError("Bạn không có quyền sửa đổi bài tập này");
  }
};

const validateCategoryAndMuscles = async (payload) => {
  if (payload.category_id !== undefined) {
    const category = await db.Category.findByPk(payload.category_id);
    if (!category) {
      throw new NotFoundError("Không tìm thấy danh mục");
    }
  }

  if (payload.muscle_group_ids !== undefined) {
    const muscleGroups = await db.MuscleGroup.findAll({
      where: { id: payload.muscle_group_ids },
    });

    if (muscleGroups.length !== payload.muscle_group_ids.length) {
      throw new NotFoundError("Một hoặc nhiều nhóm cơ không tồn tại");
    }
  }
};

const syncExerciseMuscles = async (exerciseId, muscleGroupIds, transaction) => {
  await db.ExerciseMuscle.destroy({
    where: { exercise_id: exerciseId },
    transaction,
  });

  if (!muscleGroupIds?.length) {
    return;
  }

  await db.ExerciseMuscle.bulkCreate(
    muscleGroupIds.map((muscleGroupId, index) => ({
      exercise_id: exerciseId,
      muscle_group_id: muscleGroupId,
      is_primary: index === 0,
    })),
    { transaction },
  );
};

export const getExerciseById = async (id) => {
  const exercise = await db.Exercise.findByPk(id, {
    include: exerciseInclude,
  });

  if (!exercise) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  return exercise;
};

/** Best-effort removal of a previously uploaded file under uploads/exercises/. Ignores external URLs and failures. */
export function tryDeleteOldExerciseUploadedVideo(oldVideoUrl) {
  if (!oldVideoUrl || typeof oldVideoUrl !== "string") return;
  try {
    const u = new URL(oldVideoUrl);
    const prefix = "/uploads/exercises/";
    if (!u.pathname.startsWith(prefix)) return;
    const basename = path.basename(u.pathname);
    if (!basename || basename === "." || basename === "..") return;
    const candidate = path.resolve(path.join(appConfig.paths.exerciseVideosDir, basename));
    const dirResolved = path.resolve(appConfig.paths.exerciseVideosDir);
    const rel = path.relative(dirResolved, candidate);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return;
    if (fs.existsSync(candidate)) {
      fs.unlinkSync(candidate);
    }
  } catch {
    // invalid URL or fs error — skip optional cleanup
  }
}

/** Set video_url after upload; deletes prior file only if it was stored under /uploads/exercises/. */
export const updateExerciseVideoAfterUpload = async (id, user, publicVideoUrl) => {
  const exercise = await db.Exercise.findByPk(id);
  if (!exercise) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  assertExercisePermission(exercise, user);
  const previousUrl = exercise.video_url;
  await exercise.update({ video_url: publicVideoUrl });
  tryDeleteOldExerciseUploadedVideo(previousUrl);
  return getExerciseById(id);
};

export const getAllExercises = async (filters = {}) => {
  const { muscleGroupIds = [], muscleMatch = "any" } = filters;
  const whereAnd = [];

  if (muscleGroupIds.length > 0) {
    const idsList = muscleGroupIds.join(",");
    const minRequiredMatches = muscleMatch === "all" ? muscleGroupIds.length : 1;
    whereAnd.push(
      db.Sequelize.literal(`Exercise.id IN (
        SELECT em.exercise_id
        FROM exercise_muscle em
        WHERE em.muscle_group_id IN (${idsList})
        GROUP BY em.exercise_id
        HAVING COUNT(DISTINCT em.muscle_group_id) >= ${minRequiredMatches}
      )`),
    );
  }

  const where = whereAnd.length > 0 ? { [db.Sequelize.Op.and]: whereAnd } : undefined;
  return db.Exercise.findAll({
    where,
    include: exerciseInclude,
    order: [["name", "ASC"]],
  });
};

export const createNewExercise = async (payload, userId) => {
  await validateCategoryAndMuscles(payload);

  const transaction = await db.sequelize.transaction();
  try {
    const { muscle_group_ids, ...exerciseData } = payload;
    /* Map VN → enum DB + normalize optional URLs */
    exerciseData.difficulty_level = mapDifficultyForDb(exerciseData.difficulty_level);
    exerciseData.video_url = normalizeOptionalUrl(exerciseData.video_url);
    exerciseData.thumbnail_url = normalizeOptionalUrl(exerciseData.thumbnail_url);

    const exercise = await db.Exercise.create(
      {
        ...exerciseData,
        created_by: userId,
      },
      { transaction },
    );

    await syncExerciseMuscles(exercise.id, muscle_group_ids, transaction);

    await transaction.commit();
    return getExerciseById(exercise.id);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const updateInfoExercise = async (id, data, user) => {
  const exercise = await db.Exercise.findByPk(id);
  if (!exercise) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  assertExercisePermission(exercise, user);
  await validateCategoryAndMuscles(data);

  const transaction = await db.sequelize.transaction();
  try {
    const { muscle_group_ids, ...exerciseData } = data;
    /* Map VN → enum DB when updating difficulty */
    if (exerciseData.difficulty_level !== undefined) {
      exerciseData.difficulty_level = mapDifficultyForDb(exerciseData.difficulty_level);
    }
    if (exerciseData.video_url !== undefined) {
      exerciseData.video_url = normalizeOptionalUrl(exerciseData.video_url);
    }
    if (exerciseData.thumbnail_url !== undefined) {
      exerciseData.thumbnail_url = normalizeOptionalUrl(exerciseData.thumbnail_url);
    }

    if (Object.keys(exerciseData).length > 0) {
      await exercise.update(exerciseData, { transaction });
    }

    if (muscle_group_ids !== undefined) {
      await syncExerciseMuscles(exercise.id, muscle_group_ids, transaction);
    }

    await transaction.commit();
    return getExerciseById(exercise.id);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const deleteExerciseById = async (id, user) => {
  const exercise = await db.Exercise.findByPk(id);
  if (!exercise) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  assertExercisePermission(exercise, user);
  await db.Exercise.destroy({ where: { id: exercise.id } });
};

const getWorkoutForMutation = async (userId, workoutId) => {
  const workout = await db.Workout.findOne({
    where: {
      id: workoutId,
      user_id: userId,
    },
  });

  if (!workout) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  if (workout.status === WORKOUT_STATUS.COMPLETED) {
    throw new ValidationError("Không thể sửa đổi các bài tập đã hoàn thành");
  }

  return workout;
};

const checkDataBeforeUse = async (user, params, data, isUpdate = false) => {
  const { workoutId, exerciseId } = params;

  const exercise = await db.Exercise.findByPk(exerciseId);
  if (!exercise) {
    throw new NotFoundError("Không tìm thấy bài tập");
  }

  const workout = await getWorkoutForMutation(user.id, workoutId);

  const existingWorkoutExercise = await db.WorkoutExercise.findOne({
    where: {
      workout_id: workout.id,
      exercise_id: exercise.id,
    },
  });

  if (!isUpdate && existingWorkoutExercise) {
    throw new ValidationError("Bài tập đã tồn tại trong buổi tập này");
  }

  if (isUpdate && !existingWorkoutExercise) {
    throw new NotFoundError("Không tìm thấy bài tập thể dục");
  }

  return { workout, exercise, cleanData: data };
};

export const addExerciseToWorkoutById = async (user, params, data) => {
  const { workout, exercise, cleanData } = await checkDataBeforeUse(user, params, data, false);

  await db.WorkoutExercise.create({
    ...data,
    workout_id: workout.id,
    exercise_id: exercise.id,
  });
};

export const updateExerciseToWorkoutById = async (user, params, data) => {
  const { workout, exercise, cleanData } = await checkDataBeforeUse(user, params, data, true);

  await db.WorkoutExercise.update(cleanData, {
    where: {
      workout_id: workout.id,
      exercise_id: exercise.id,
    },
  });
};

export const removeExerciseToWorkoutById = async (user, params) => {
  const { workoutId, workoutExerciseId } = params;

  await getWorkoutForMutation(user.id, workoutId);

  const workoutExercise = await db.WorkoutExercise.findOne({
    where: {
      id: workoutExerciseId,
      workout_id: workoutId,
    },
  });

  if (!workoutExercise) {
    throw new NotFoundError("Không tìm thấy bài tập thể dục");
  }

  await db.WorkoutExercise.destroy({
    where: {
      id: workoutExercise.id,
      workout_id: workoutId,
    },
  });
};
