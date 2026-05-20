import asyncHandler from "../middlewares/asyncHandler.js";
import { parseSchema } from "../validators/common.js";
import {
  askCoachSchema,
  generateWorkoutPlanSchema,
  recommendationIdParamSchema,
} from "../validators/aiValidator.js";
import AIRecommendationService from "../services/aiRecommendationService.js";

// Singleton service — constructor không gọi network, an toàn ở module level
const aiRecommendationService = new AIRecommendationService();

export const askCoach = asyncHandler(async (req, res) => {
  const payload = parseSchema(askCoachSchema, req.body);
  const result = await aiRecommendationService.askCoach(req.user.id, payload);
  return res.status(200).json(result);
});

export const generateWorkoutPlan = asyncHandler(async (req, res) => {
  const payload = parseSchema(generateWorkoutPlanSchema, req.body);
  const result = await aiRecommendationService.generateWorkoutPlan(req.user.id, payload);
  return res.status(201).json(result);
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await aiRecommendationService.getRecommendations(req.user.id);
  return res.status(200).json({ recommendations });
});

export const getRecommendationDetail = asyncHandler(async (req, res) => {
  const params = parseSchema(recommendationIdParamSchema, req.params);
  const recommendation = await aiRecommendationService.getRecommendationDetail(
    req.user.id,
    params.id,
  );
  return res.status(200).json({ recommendation });
});
