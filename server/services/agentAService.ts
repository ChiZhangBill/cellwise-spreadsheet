import { openRouterConfig } from "../config/openRouterModels";
import { prompts } from "../config/prompts";
import type { FinancialAnalysisResponse, SheetSnapshot } from "../types/api";
import { callOpenRouterJson } from "./openRouterClient";

export async function runFinancialAnalysis({
  prompt,
  sheet,
}: {
  prompt: string;
  sheet: SheetSnapshot;
}) {
  return callOpenRouterJson<FinancialAnalysisResponse>({
    model: openRouterConfig.agentA.model,
    schemaName: "financial-analysis",
    messages: [
      { role: "system", content: prompts.financialAnalysis },
      {
        role: "user",
        content: JSON.stringify({
          userPrompt: prompt,
          sheet,
        }),
      },
    ],
  });
}
