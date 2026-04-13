import { openRouterConfig } from "../config/openRouterModels";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export async function callOpenRouterJson<T>({
  messages,
  model,
  schemaName,
}: {
  messages: ChatMessage[];
  model: string;
  schemaName: string;
}): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": openRouterConfig.siteUrl,
      "X-Title": openRouterConfig.appName,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: {
        type: "json_object",
      },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter ${schemaName} request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error(`OpenRouter ${schemaName} response did not include JSON text.`);
  }

  try {
    return JSON.parse(extractJsonObject(content)) as T;
  } catch {
    throw new Error(`OpenRouter ${schemaName} response was not valid JSON.`);
  }
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedJson?.[1]) {
    return fencedJson[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}
