import { openRouterConfig } from "../config/openRouterModels";
import { prompts } from "../config/prompts";
import type {
  AnomalyCheckResponse,
  AssumptionExtractionResponse,
  PromptRefinementResponse,
  SheetSnapshot,
} from "../types/api";
import { callOpenRouterJson } from "./openRouterClient";

export async function runPromptRefinement(prompt: string, attempt: number) {
  return callOpenRouterJson<PromptRefinementResponse>({
    model: openRouterConfig.agentB.model,
    schemaName: "prompt-refinement",
    messages: [
      { role: "system", content: prompts.promptRefinement },
      { role: "user", content: JSON.stringify({ regenerationAttempt: attempt, userPrompt: prompt }) },
    ],
  });
}

export async function runAnomalyCheck({
  analysisText,
  prompt,
  sheet,
}: {
  analysisText: string;
  prompt: string;
  sheet: SheetSnapshot;
}) {
  return callOpenRouterJson<AnomalyCheckResponse>({
    model: openRouterConfig.agentB.model,
    schemaName: "anomaly-check",
    messages: [
      { role: "system", content: prompts.anomalyCheck },
      { role: "user", content: JSON.stringify({ userPrompt: prompt, analysisText, sheet }) },
    ],
  });
}

export async function runAssumptionExtraction({
  analysisText,
  prompt,
}: {
  analysisText: string;
  prompt: string;
}) {
  return callOpenRouterJson<AssumptionExtractionResponse>({
    model: openRouterConfig.agentB.model,
    schemaName: "extract-assumptions",
    messages: [
      { role: "system", content: prompts.extractAssumptions },
      { role: "user", content: JSON.stringify({ userPrompt: prompt, analysisText }) },
    ],
  });
}
