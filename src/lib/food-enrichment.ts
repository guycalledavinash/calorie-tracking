import type { EnrichedFoodAnalysisResult, FoodAnalysisResult } from "@/lib/food-analysis";
import { calculateNutritionForDetectedFood, getNutritionErrorMessage } from "@/lib/nutrition-calculator";

export async function enrichFoodAnalysisWithNutrition(analysis: FoodAnalysisResult): Promise<EnrichedFoodAnalysisResult> {
  const foods = await Promise.all(
    analysis.foods.map(async (food) => {
      try {
        const nutrition = await calculateNutritionForDetectedFood(food);

        if (!nutrition) {
          return {
            ...food,
            nutrition: null,
            nutritionError: "No USDA FoodData Central nutrition match found.",
          };
        }

        return {
          ...food,
          nutrition,
        };
      } catch (error) {
        console.error("USDA nutrition lookup failed", error);

        return {
          ...food,
          nutrition: null,
          nutritionError: getNutritionErrorMessage(error),
        };
      }
    }),
  );

  return { foods };
}
