import type { FoodAnalysisFood, FoodNutrition, NutritionTotals } from "@/lib/food-analysis";
import { searchUsdaFoods, UsdaClientError, type UsdaFoodSearchResult } from "@/lib/usda-client";

const NUTRIENT_IDS = {
  calories: new Set([1008, 2047, 2048]),
  protein: new Set([1003]),
  carbohydrates: new Set([1005, 1050]),
  fat: new Set([1004]),
} as const;

const DATA_TYPE_PRIORITY: Record<string, number> = {
  Foundation: 4,
  "SR Legacy": 3,
  "Survey (FNDDS)": 2,
  Branded: 1,
};

function normalizeFoodName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreFoodMatch(detectedName: string, food: UsdaFoodSearchResult) {
  const queryTokens = normalizeFoodName(detectedName);
  const descriptionTokens = new Set(normalizeFoodName(food.description));
  const matchingTokens = queryTokens.filter((token) => descriptionTokens.has(token)).length;
  const tokenScore = queryTokens.length === 0 ? 0 : matchingTokens / queryTokens.length;
  const dataTypeScore = food.dataType ? DATA_TYPE_PRIORITY[food.dataType] ?? 0 : 0;

  return tokenScore * 10 + dataTypeScore;
}

function findNutrientValue(food: UsdaFoodSearchResult, nutrientIds: Set<number>) {
  return food.foodNutrients?.find((nutrient) => {
    if (typeof nutrient.nutrientId === "number" && nutrientIds.has(nutrient.nutrientId)) {
      return true;
    }

    return false;
  })?.value;
}

function roundNutrition(value: number) {
  return Math.round(value * 10) / 10;
}

function scalePer100Grams(value: number | undefined, grams: number) {
  return roundNutrition(((value ?? 0) * grams) / 100);
}

function calculateNutritionFromFood(food: UsdaFoodSearchResult, grams: number): NutritionTotals {
  return {
    calories: scalePer100Grams(findNutrientValue(food, NUTRIENT_IDS.calories), grams),
    protein: scalePer100Grams(findNutrientValue(food, NUTRIENT_IDS.protein), grams),
    carbohydrates: scalePer100Grams(findNutrientValue(food, NUTRIENT_IDS.carbohydrates), grams),
    fat: scalePer100Grams(findNutrientValue(food, NUTRIENT_IDS.fat), grams),
  };
}

export function findClosestUsdaFoodMatch(detectedName: string, foods: UsdaFoodSearchResult[]) {
  return foods
    .filter((food) => food.foodNutrients?.length)
    .slice()
    .sort((first, second) => scoreFoodMatch(detectedName, second) - scoreFoodMatch(detectedName, first))[0];
}

export async function calculateNutritionForDetectedFood(food: FoodAnalysisFood): Promise<FoodNutrition | null> {
  if (food.estimatedWeightGrams <= 0) {
    return null;
  }

  const searchResults = await searchUsdaFoods(food.name);
  const closestFood = findClosestUsdaFoodMatch(food.name, searchResults);

  if (!closestFood) {
    return null;
  }

  return {
    fdcId: closestFood.fdcId,
    usdaDescription: closestFood.description,
    ...calculateNutritionFromFood(closestFood, food.estimatedWeightGrams),
  };
}

export function getNutritionErrorMessage(error: unknown) {
  if (error instanceof UsdaClientError) {
    return error.message;
  }

  return "Unable to calculate nutrition for this food.";
}
