export type AssistantMessageKind = "plain" | "suggestion" | "warning";

export type AssistantRole = "assistant" | "user";

export type PendingAction = {
  id: string;
  label: string;
  description: string;
  impact: "visual-only" | "formula-change" | "data-change";
};

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  kind: AssistantMessageKind;
  text: string;
  analysisMeta?: AnalysisMeta;
  anomalyFlags?: AnomalyFlag[];
  pendingAction?: PendingAction;
};

export type AssistantSettings = {
  promptRefinement: boolean;
  anomalyDetection: boolean;
  confidenceDisplay: boolean;
};

export type PromptRefinement = {
  originalPrompt: string;
  refinedPrompt: string;
  rationale: string;
};

export type WarningLevel = "low" | "medium" | "high";

export type AnomalyFlag = {
  id: string;
  level: WarningLevel;
  title: string;
  summary: string;
  targetLabel: string;
  reason: string;
};

export type AnalysisMeta = {
  confidenceLabel: "Low" | "Medium" | "High";
  confidenceScore: number;
  abnormalityLevel: WarningLevel;
  assumptions: string[];
  warningReason: string;
};

export type SheetCell = {
  id: string;
  column: string;
  row: number;
  value: string;
  variant?: "header" | "currency" | "multiple" | "percent" | "sector" | "warning";
};
