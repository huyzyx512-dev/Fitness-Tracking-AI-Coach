import express from "express"
import { authenticationToken } from "../middlewares/authMiddleware.js";
import { uploadExerciseVideo } from "../middlewares/uploadExerciseVideo.js";
import {
  createExercise,
  deleteExercise,
  getExercise,
  getExercises,
  updateExercise,
  uploadExerciseVideoController,
} from "../controllers/exerciseController.js";

const router = express.Router();

router.get('/', getExercises);
router.get('/:id', getExercise);

router.post('/', authenticationToken, createExercise);
router.post('/:id/video', authenticationToken, uploadExerciseVideo, uploadExerciseVideoController);

router.put('/:id', authenticationToken, updateExercise);

router.delete('/:id', authenticationToken, deleteExercise);

export default router