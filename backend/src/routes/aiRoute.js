import express from "express";
import {
  askCoach,
  generateWorkoutPlan,
  getRecommendations,
  getRecommendationDetail,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/ask", askCoach);
router.post("/recommendations/generate", generateWorkoutPlan);
router.get("/recommendations", getRecommendations);
router.get("/recommendations/:id", getRecommendationDetail);

export default router;
