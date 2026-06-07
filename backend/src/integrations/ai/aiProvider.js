class AIProvider {
  /**
   * Trả lời câu hỏi fitness của người dùng.
   * @param {{ message: string, context?: string, userContext?: object }} payload
   * @returns {Promise<{ answer: string, usage: object|null, provider: string, model: string }>}
   */
  async askCoach(payload) {
    throw new Error("askCoach chưa được triển khai");
  }

  /**
   * Tạo kế hoạch tập luyện dựa trên input người dùng và danh sách bài tập.
   * @param {{ input: object, availableExercises: array, availableCategories: array, availableMuscleGroups: array, userContext?: object }} payload
   * @returns {Promise<{ plan: object, usage: object|null, provider: string, model: string }>}
   */
  async generateWorkoutPlan(payload) {
    throw new Error("generateWorkoutPlan chưa được triển khai");
  }

  /**
   * Ngoài scope MVP — không implement.
   */
  async generateProgressInsights() {
    throw new Error("generateProgressInsights ngoài scope MVP");
  }
}

export default AIProvider;
