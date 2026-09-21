const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_REQUEST_TIMEOUT_MS = 20_000;

export type UsdaFoodNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  nutrientNumber?: string;
  value?: number;
  unitName?: string;
};

export type UsdaFoodSearchResult = {
  fdcId: number;
  description: string;
  dataType?: string;
  foodCategory?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFoodSearchResult[];
};

export class UsdaClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "UsdaClientError";
  }
}

function getApiKey() {
  const apiKey = process.env.USDA_FOODDATA_API_KEY;

  if (!apiKey) {
    throw new UsdaClientError("USDA FoodData Central API key is not configured.");
  }

  return apiKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUsdaFood(value: unknown): value is UsdaFoodSearchResult {
  return isRecord(value) && typeof value.fdcId === "number" && typeof value.description === "string";
}

function parseSearchResponse(value: unknown): UsdaFoodSearchResult[] {
  if (!isRecord(value) || !Array.isArray(value.foods)) {
    return [];
  }

  return value.foods.filter(isUsdaFood);
}

export async function searchUsdaFoods(query: string, pageSize = 10) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), USDA_REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    const requestUrl = new URL(USDA_SEARCH_URL);
    requestUrl.searchParams.set("api_key", getApiKey());

    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        pageSize,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new UsdaClientError("USDA FoodData Central request timed out.", 504);
    }

    throw new UsdaClientError("Unable to reach USDA FoodData Central.", 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(responseBody) && typeof responseBody.message === "string"
        ? responseBody.message
        : "USDA FoodData Central request failed.";

    throw new UsdaClientError(message, response.status);
  }

  return parseSearchResponse(responseBody as UsdaSearchResponse);
}
