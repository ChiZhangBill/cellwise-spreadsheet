export type AssistantMessageKind = "plain" | "suggestion" | "warning";

export type AssistantRole = "assistant" | "user";

export type PendingSheetMutation =
  | {
      type: "insert-row-after";
      /** A new empty row is inserted immediately after this row (1-based). */
      anchorRow: number;
    }
  | {
      type: "insert-column-after";
      /** A new empty column is inserted immediately to the right of this column (A–J). */
      anchorColumn: string;
    };

export type PendingCellWrite = {
  cellId: string;
  value: string;
  variant?: SheetCell["variant"];
};

export type PendingAction = {
  id: string;
  label: string;
  description: string;
  impact: "visual-only" | "formula-change" | "data-change";
  /** When the user confirms, apply this structural change to the sheet. */
  sheetMutation?: PendingSheetMutation;
  /** Cell values to write after any structural mutation. Applied in order. */
  populateCells?: PendingCellWrite[];
  /** After confirm (and optional mutation), scroll to this cell and highlight the row. */
  focusCellId?: string;
};

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  kind: AssistantMessageKind;
  text: string;
  analysisMeta?: AnalysisMeta;
  anomalyFlags?: AnomalyFlag[];
  isStreaming?: boolean;
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

export type WarningCategory =
  | "assumption"
  | "limitation"
  | "uncertainty"
  | "recommendation";

export type AnomalyFlag = {
  id: string;
  level: WarningLevel;
  category: WarningCategory;
  label: string;
  explanation: string;
  excerpt?: string;
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
