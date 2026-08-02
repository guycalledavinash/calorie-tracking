import { NextResponse, type NextRequest } from "next/server";

import { enrichFoodAnalysisWithNutrition } from "@/lib/food-enrichment";
import { analyzeFoodImage } from "@/lib/openai-food-vision";
import { OpenAIClientError } from "@/lib/openai-client";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getStatusForOpenAIError(error: OpenAIClientError) {
  if (error.status === 401 || error.status === 403) {
    return 502;
  }

  if (error.status === 429) {
    return 429;
  }

  if (error.status && error.status >= 400 && error.status < 500) {
    return 400;
  }

  return 502;
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request must be multipart/form-data.", 400);
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return jsonError("Upload an image file in the 'image' form field.", 400);
  }

  if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
    return jsonError("Unsupported image type. Use JPEG, PNG, or WebP.", 415);
  }

  if (image.size === 0) {
    return jsonError("Uploaded image is empty.", 400);
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    return jsonError("Uploaded image must be 10MB or smaller.", 413);
  }

  try {
    const analysis = await analyzeFoodImage(image);
    const enrichedAnalysis = await enrichFoodAnalysisWithNutrition(analysis);

    return NextResponse.json(enrichedAnalysis);
  } catch (error) {
    if (error instanceof OpenAIClientError) {
      console.error("OpenAI food analysis failed", error);
      return jsonError(error.message, getStatusForOpenAIError(error));
    }

    console.error("Unexpected food analysis failure", error);
    return jsonError("Unable to analyze image at this time.", 500);
  }
}
