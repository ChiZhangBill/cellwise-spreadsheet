import type { AnalysisMeta, AnomalyFlag, AssistantMessage, PendingAction, PromptRefinement, SheetCell } from "../types";
import type { WarningCategory } from "../types";

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
  anomalyFlags: unknown[];
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
  signal?: AbortSignal,
): Promise<AssistantMessage> {
  const sheet = createSheetSnapshot(sheetCells);
  const analysis = await postJson<FinancialAnalysisResponse>(
    "/api/financial-analysis",
    {
      prompt,
      sheet,
    },
    signal,
  );

  const [anomalyResult, assumptionResult] = await Promise.all([
    options.anomalyDetection
      ? postJson<AnomalyCheckResponse>(
          "/api/anomaly-check",
          {
            analysisText: analysis.text,
            prompt,
            sheet,
          },
          signal,
        ).then((result) => normalizeAnomalyFlags(result.anomalyFlags, analysis.text))
      : Promise.resolve<AnomalyFlag[] | undefined>(undefined),
    options.confidenceDisplay
      ? postJson<AssumptionExtractionResponse>(
          "/api/extract-assumptions",
          {
            analysisText: analysis.text,
            prompt,
          },
          signal,
        )
      : Promise.resolve<AssumptionExtractionResponse | undefined>(undefined),
  ]);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    kind: anomalyResult?.length ? "warning" : "suggestion",
    ...normalizeAssistantSuggestion(analysis),
    anomalyFlags: anomalyResult,
    analysisMeta: assumptionResult?.analysisMeta,
  };
}

function normalizeAssistantSuggestion(analysis: FinancialAnalysisResponse) {
  const pendingAction = analysis.pendingAction;

  if (!pendingAction || !isHealthcareCompsAction(pendingAction)) {
    return {
      text: analysis.text,
      pendingAction,
    };
  }

  return {
    text: `${analysis.text}\n\nSuggestion: ${pendingAction.label} - ${pendingAction.description}`,
    pendingAction: undefined,
  };
}

function isHealthcareCompsAction(action: PendingAction) {
  const combinedText = `${action.id} ${action.label} ${action.description}`.toLowerCase();
  return combinedText.includes("healthcare") && (combinedText.includes("comp") || combinedText.includes("company"));
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
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

function normalizeAnomalyFlags(rawFlags: unknown[], analysisText: string): AnomalyFlag[] {
  const firstFlagByCategory = new Map<WarningCategory, AnomalyFlag>();

  for (const rawFlag of rawFlags) {
    if (!rawFlag || typeof rawFlag !== "object") {
      continue;
    }

    const candidate = rawFlag as Record<string, unknown>;
    const category = normalizeCategory(candidate);

    if (!category || firstFlagByCategory.has(category)) {
      continue;
    }

    const explanation = createShortExplanation(candidate);
    if (!explanation) {
      continue;
    }

    firstFlagByCategory.set(category, {
      id: readText(candidate.id) || `${category}-${firstFlagByCategory.size + 1}`,
      level: normalizeLevel(candidate.level),
      category,
      label: defaultLabelForCategory(category),
      explanation,
      excerpt: createExcerpt(candidate, analysisText),
    });
  }

  return Array.from(firstFlagByCategory.values());
}

function normalizeCategory(candidate: Record<string, unknown>): WarningCategory | undefined {
  const explicitCategory = readText(candidate.category)?.toLowerCase();

  if (
    explicitCategory === "assumption" ||
    explicitCategory === "limitation" ||
    explicitCategory === "uncertainty" ||
    explicitCategory === "recommendation"
  ) {
    return explicitCategory;
  }

  const combinedText = [
    readText(candidate.title),
    readText(candidate.summary),
    readText(candidate.reason),
    readText(candidate.targetLabel),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combinedText.includes("assumption") || combinedText.includes("assume")) {
    return "assumption";
  }

  if (
    combinedText.includes("limit") ||
    combinedText.includes("missing") ||
    combinedText.includes("does not define") ||
    combinedText.includes("does not perform")
  ) {
    return "limitation";
  }

  if (
    combinedText.includes("uncertain") ||
    combinedText.includes("may") ||
    combinedText.includes("could") ||
    combinedText.includes("unclear")
  ) {
    return "uncertainty";
  }

  return "recommendation";
}

function createShortExplanation(candidate: Record<string, unknown>) {
  const primaryText =
    readText(candidate.explanation) ||
    [readText(candidate.summary), readText(candidate.reason)].filter(Boolean).join(" ");

  if (!primaryText) {
    return "";
  }

  return primaryText.length > 180 ? `${primaryText.slice(0, 177).trimEnd()}...` : primaryText;
}

function createExcerpt(candidate: Record<string, unknown>, analysisText: string) {
  const explicitExcerpt = readText(candidate.excerpt);

  if (explicitExcerpt && analysisText.includes(explicitExcerpt)) {
    return explicitExcerpt;
  }

  const sentences = analysisText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return undefined;
  }

  const searchTerms = [
    ...readText(candidate.excerpt).split(/\s+/),
    ...readText(candidate.label).split(/\s+/),
    ...readText(candidate.summary).split(/\s+/),
    ...readText(candidate.targetLabel).split(/\s+/),
  ]
    .map((term) => term.toLowerCase().replace(/[^a-z0-9$.%-]/g, ""))
    .filter((term) => term.length >= 3);

  const bestSentence = sentences
    .map((sentence) => ({
      sentence,
      score: searchTerms.reduce((score, term) => (sentence.toLowerCase().includes(term) ? score + 1 : score), 0),
    }))
    .sort((left, right) => right.score - left.score)[0];

  return bestSentence && bestSentence.score > 0 ? bestSentence.sentence : sentences[0];
}

function normalizeLevel(level: unknown): AnomalyFlag["level"] {
  return level === "high" || level === "medium" || level === "low" ? level : "medium";
}

function defaultLabelForCategory(category: WarningCategory) {
  switch (category) {
    case "assumption":
      return "Assumption";
    case "limitation":
      return "Limitation";
    case "uncertainty":
      return "Uncertainty";
    case "recommendation":
      return "Recommendation";
  }
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}
