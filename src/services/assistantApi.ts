import type { AnalysisMeta, AnomalyFlag, AssistantMessage, PendingAction, PromptRefinement, SheetCell } from "../types";

type RequestAssistantOptions = {
  anomalyDetection: boolean;
  confidenceDisplay: boolean;
};

type SheetSnapshot = {
  cells: Array<{
    id: string;
    value: string;
  }>;
};

type FinancialAnalysisResponse = {
  text: string;
  pendingAction?: PendingAction;
};

type AnomalyCheckResponse = {
  anomalyFlags: AnomalyFlag[];
};

type AssumptionExtractionResponse = {
  analysisMeta: AnalysisMeta;
};

export async function refinePrompt(prompt: string, attempt = 0): Promise<PromptRefinement> {
  return postJson<PromptRefinement>("/api/refine-prompt", { attempt, prompt });
}

export async function requestAssistantResponse(
  prompt: string,
  options: RequestAssistantOptions,
  sheetCells: SheetCell[],
): Promise<AssistantMessage> {
  const sheet = createSheetSnapshot(sheetCells);
  const analysis = await postJson<FinancialAnalysisResponse>("/api/financial-analysis", {
    prompt,
    sheet,
  });

  const [anomalyResult, assumptionResult] = await Promise.all([
    options.anomalyDetection
      ? postJson<AnomalyCheckResponse>("/api/anomaly-check", {
          analysisText: analysis.text,
          prompt,
          sheet,
        })
      : Promise.resolve<AnomalyCheckResponse | undefined>(undefined),
    options.confidenceDisplay
      ? postJson<AssumptionExtractionResponse>("/api/extract-assumptions", {
          analysisText: analysis.text,
          prompt,
        })
      : Promise.resolve<AssumptionExtractionResponse | undefined>(undefined),
  ]);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    kind: anomalyResult?.anomalyFlags.length ? "warning" : "suggestion",
    text: analysis.text,
    anomalyFlags: anomalyResult?.anomalyFlags,
    analysisMeta: assumptionResult?.analysisMeta,
    pendingAction: analysis.pendingAction,
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(data?.error ?? "The assistant API request failed.");
  }

  return data as T;
}

function createSheetSnapshot(sheetCells: SheetCell[]): SheetSnapshot {
  return {
    cells: sheetCells
      .filter((cell) => cell.value.trim().length > 0)
      .map((cell) => ({
        id: cell.id,
        value: cell.value,
      })),
  };
}
