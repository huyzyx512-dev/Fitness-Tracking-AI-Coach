import { createAIProvider } from "../integrations/ai/aiProviderFactory.js";

class AIRecommendationService {
  /**
   * @param {{ aiProvider?: import('../integrations/ai/aiProvider.js').default }} options
   */
  constructor({ aiProvider } = {}) {
    // Nếu không inject provider, tạo từ config env (lazy — không gọi network ở đây)
    this.aiProvider = aiProvider !== undefined ? aiProvider : createAIProvider();
  }

  async askCoach(payload) {
    if (!this.aiProvider) {
      throw new Error("AI provider chưa được cấu hình");
    }
    return this.aiProvider.askCoach(payload);
  }

  async generateWorkoutPlan(payload) {
    if (!this.aiProvider) {
      throw new Error("AI provider chưa được cấu hình");
    }
    return this.aiProvider.generateWorkoutPlan(payload);
  }

  /** Ngoài scope MVP — không dùng */
  async generateProgressInsights() {
    throw new Error("generateProgressInsights ngoài scope MVP");
  }
}

export default AIRecommendationService;
