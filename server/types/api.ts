export type WarningLevel = "low" | "medium" | "high";
export type WarningCategory = "assumption" | "limitation" | "uncertainty" | "recommendation";

export type SheetSnapshot = {
  cells: Array<{
    id: string;
    value: string;
  }>;
};

export type PendingSheetMutationDto =
  | {
      type: "insert-row-after";
      anchorRow: number;
    }
  | {
      type: "insert-column-after";
      anchorColumn: string;
    };

export type PendingActionDto = {
  id: string;
  label: string;
  description: string;
  impact: "visual-only" | "formula-change" | "data-change";
  sheetMutation?: PendingSheetMutationDto;
  focusCellId?: string;
};

export type PromptRefinementResponse = {
  originalPrompt: string;
  refinedPrompt: string;
  rationale: string;
};

export type FinancialAnalysisResponse = {
  text: string;
  pendingAction?: PendingActionDto;
};

export type AnomalyCheckResponse = {
  anomalyFlags: Array<{
    id: string;
    level: WarningLevel;
    category: WarningCategory;
    label: string;
    explanation: string;
    excerpt?: string;
  }>;
};

export type AssumptionExtractionResponse = {
  analysisMeta: {
    confidenceLabel: "Low" | "Medium" | "High";
    confidenceScore: number;
    abnormalityLevel: WarningLevel;
    assumptions: string[];
    warningReason: string;
  };
};
