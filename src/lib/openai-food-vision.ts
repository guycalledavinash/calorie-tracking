import { foodAnalysisJsonSchema, isFoodAnalysisResult, type FoodAnalysisResult } from "@/lib/food-analysis";
import { createOpenAIResponse, OpenAIClientError } from "@/lib/openai-client";

const FOOD_ANALYSIS_INSTRUCTIONS = `You identify visible foods in a user-uploaded image.
Return JSON only with a foods array. Do not calculate calories or nutrition.
For each visible food, estimate name, weight in grams, confidence from 0 to 1, and assumptions used.
If no food is visible, return {"foods":[]}.`;

function fileToDataUrl(file: File, base64: string) {
  return `data:${file.type};base64,${base64}`;
}

export async function analyzeFoodImage(file: File): Promise<FoodAnalysisResult> {
  const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
  const outputText = await createOpenAIResponse({
    instructions: FOOD_ANALYSIS_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analyze this food image and return only the requested JSON schema. Do not include calories.",
          },
          {
            type: "input_image",
            image_url: fileToDataUrl(file, base64Image),
            detail: "auto",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "food_image_analysis",
        strict: true,
        schema: foodAnalysisJsonSchema,
      },
    },
    temperature: 0,
  });

  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new OpenAIClientError("OpenAI returned malformed JSON.");
  }

  if (!isFoodAnalysisResult(parsed)) {
    throw new OpenAIClientError("OpenAI returned JSON that does not match the expected schema.");
  }

  return parsed;
}
