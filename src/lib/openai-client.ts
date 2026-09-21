const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS = 60_000;

type ResponseFormatJsonSchema = {
  type: "json_schema";
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
};

type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" };

type CreateResponseParams = {
  instructions: string;
  input: Array<{
    role: "user";
    content: InputContent[];
  }>;
  text: {
    format: ResponseFormatJsonSchema;
  };
  temperature?: number;
};

type ResponseOutputText = {
  type: "output_text";
  text: string;
};

type ResponseOutputMessage = {
  type: "message";
  content?: ResponseOutputText[];
};

type ResponseBody = {
  output?: ResponseOutputMessage[];
  output_text?: string;
};

export class OpenAIClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OpenAIClientError";
  }
}

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIClientError("OpenAI API key is not configured.");
  }

  return apiKey;
}

function extractOutputText(responseBody: ResponseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  const outputText = responseBody.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content): content is ResponseOutputText => content.type === "output_text")
    .map((content) => content.text)
    .join("");

  return outputText || null;
}

export async function createOpenAIResponse(params: CreateResponseParams) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        ...params,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenAIClientError("OpenAI request timed out.", 504);
    }

    throw new OpenAIClientError("Unable to reach OpenAI.", 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "object" &&
      responseBody.error !== null &&
      "message" in responseBody.error &&
      typeof responseBody.error.message === "string"
        ? responseBody.error.message
        : "OpenAI request failed.";

    throw new OpenAIClientError(message, response.status);
  }

  const outputText = extractOutputText(responseBody as ResponseBody);

  if (!outputText) {
    throw new OpenAIClientError("OpenAI response did not include output text.");
  }

  return outputText;
}
