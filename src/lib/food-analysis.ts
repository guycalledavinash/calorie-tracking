export type FoodAnalysisFood = {
  name: string;
  estimatedWeightGrams: number;
  confidence: number;
  assumptions: string[];
};

export type FoodAnalysisResult = {
  foods: FoodAnalysisFood[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFood(value: unknown): value is FoodAnalysisFood {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.estimatedWeightGrams === "number" &&
    Number.isFinite(value.estimatedWeightGrams) &&
    typeof value.confidence === "number" &&
    Number.isFinite(value.confidence) &&
    value.confidence >= 0 &&
    value.confidence <= 1 &&
    isStringArray(value.assumptions)
  );
}

export function isFoodAnalysisResult(value: unknown): value is FoodAnalysisResult {
  return isRecord(value) && Array.isArray(value.foods) && value.foods.every(isFood);
}

export const foodAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["foods"],
  properties: {
    foods: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "estimatedWeightGrams", "confidence", "assumptions"],
        properties: {
          name: { type: "string" },
          estimatedWeightGrams: { type: "number", minimum: 0 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          assumptions: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;
