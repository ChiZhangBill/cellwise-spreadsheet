import type { AnalysisMeta, AnomalyFlag, AssistantMessage } from "../types";

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

type RequestAssistantOptions = {
  anomalyDetection: boolean;
  confidenceDisplay: boolean;
};

const baseMeta: AnalysisMeta = {
  confidenceLabel: "High",
  confidenceScore: 86,
  abnormalityLevel: "low",
  assumptions: [
    "Only visible mock rows are included.",
    "Currency values use the displayed rounded units.",
    "EV/EBITDA values are treated as already calculated.",
  ],
  warningReason: "No severe anomaly is required for this result, but all findings remain reviewable.",
};

function attachReviewData(
  message: AssistantMessage,
  options: RequestAssistantOptions,
  meta: AnalysisMeta,
  anomalyFlags: AnomalyFlag[] = [],
): AssistantMessage {
  return {
    ...message,
    analysisMeta: options.confidenceDisplay ? meta : undefined,
    anomalyFlags: options.anomalyDetection ? anomalyFlags : undefined,
  };
}

export async function requestAssistantResponse(
  prompt: string,
  options: RequestAssistantOptions,
): Promise<AssistantMessage> {
  await delay(650);

  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("simulate failure")) {
    throw new Error("Mock assistant failure");
  }

  if (normalizedPrompt.includes("delete") || normalizedPrompt.includes("replace")) {
    return attachReviewData(
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "warning",
        text: "That could change spreadsheet data. I can prepare a proposed change, but I need your explicit confirmation before anything is applied.",
        pendingAction: {
          id: "review-data-change",
          label: "Review proposed data change",
          description: "Open a review state for the requested edit instead of applying it automatically.",
          impact: "data-change",
        },
      },
      options,
      {
        ...baseMeta,
        confidenceLabel: "Medium",
        confidenceScore: 72,
        abnormalityLevel: "high",
        warningReason: "The prompt requests a potentially destructive spreadsheet edit.",
      },
      [
        {
          id: "destructive-edit",
          level: "high",
          title: "Data change requires confirmation",
          summary: "The request may alter or replace cell values.",
          targetLabel: "pending action",
          reason: "Shared automation rules require explicit approval for data-changing actions.",
        },
      ],
    );
  }

  if (normalizedPrompt.includes("healthcare") || normalizedPrompt.includes("filter")) {
    return attachReviewData(
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "suggestion",
        text: "I found five Healthcare IT companies in the mock dataset. I can prepare a filter view, but I will not hide any rows unless you confirm.",
        pendingAction: {
          id: "filter-healthcare-it",
          label: "Filter Healthcare IT rows",
          description: "Shows only Healthcare IT companies after confirmation. No rows are deleted.",
          impact: "visual-only",
        },
      },
      options,
      {
        ...baseMeta,
        confidenceLabel: "High",
        confidenceScore: 91,
        abnormalityLevel: "low",
        assumptions: ["Sector labels are read from column B.", "Filtering is treated as a temporary view, not a deletion."],
        warningReason: "Filtering can hide non-healthcare rows from view, so it remains a confirmable action.",
      },
    );
  }

  if (normalizedPrompt.includes("ev/ebitda") || normalizedPrompt.includes("multiple")) {
    return attachReviewData(
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "suggestion",
        text: "The EV/EBITDA multiples range from 11.0x to 20.5x. DataHarbor is the highest multiple in this mock sheet.",
        pendingAction: {
          id: "review-multiple-column",
          label: "Review EV/EBITDA calculations",
          description: "Prepares a formula review for EV divided by EBITDA before any formula changes are applied.",
          impact: "formula-change",
        },
      },
      options,
      {
        ...baseMeta,
        confidenceLabel: "High",
        confidenceScore: 88,
        abnormalityLevel: "medium",
        assumptions: ["EV/EBITDA values are compared as displayed.", "The populated company rows are the analysis universe."],
        warningReason: "DataHarbor sits at the high end of the mock valuation range.",
      },
      [
        {
          id: "high-multiple-dataharbor",
          level: "medium",
          title: "High EV/EBITDA multiple",
          summary: "DataHarbor is listed at 20.5x, above the rest of the sample range.",
          targetLabel: "DataHarbor EV/EBITDA",
          reason: "A high multiple can imply aggressive valuation assumptions or stronger expected growth.",
        },
      ],
    );
  }

  if (normalizedPrompt.includes("outlier")) {
    return attachReviewData(
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "warning",
        text: "FinSight and DataHarbor have the largest revenue values in the mock dataset. I can mark them for review, but I need confirmation before adding highlights.",
        pendingAction: {
          id: "highlight-revenue-outliers",
          label: "Highlight revenue outliers",
          description: "Adds review highlighting for revenue outliers without changing source values.",
          impact: "visual-only",
        },
      },
      options,
      {
        ...baseMeta,
        confidenceLabel: "High",
        confidenceScore: 89,
        abnormalityLevel: "medium",
        assumptions: ["Revenue outliers are based on the visible sample only.", "The check compares displayed revenue magnitude, not audited statements."],
        warningReason: "Two companies sit noticeably above the rest of the mock revenue sample.",
      },
      [
        {
          id: "revenue-outlier-finsight",
          level: "medium",
          title: "Revenue concentration",
          summary: "FinSight is the largest revenue row at $306M.",
          targetLabel: "FinSight revenue",
          reason: "Large peers can skew averages when the dataset is small.",
        },
        {
          id: "revenue-outlier-dataharbor",
          level: "low",
          title: "Secondary revenue outlier",
          summary: "DataHarbor is also near the top of the sample at $244M.",
          targetLabel: "DataHarbor revenue",
          reason: "It may affect benchmark calculations but is less extreme than FinSight.",
        },
      ],
    );
  }

  if (normalizedPrompt.includes("formula") || normalizedPrompt.includes("margin")) {
    return attachReviewData(
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "suggestion",
        text: "The average EBITDA margin is about 20.2% across the populated mock company rows. I can add a formula check, but it should stay pending until you confirm.",
        pendingAction: {
          id: "add-ebitda-margin-check",
          label: "Add EBITDA margin check",
          description: "Creates a proposed formula validation row for EBITDA divided by revenue.",
          impact: "formula-change",
        },
      },
      options,
      {
        ...baseMeta,
        confidenceLabel: "Medium",
        confidenceScore: 83,
        abnormalityLevel: "low",
        assumptions: ["Margins are averaged across populated company rows.", "Displayed percentages are rounded to one decimal place."],
        warningReason: "Rounding may slightly change the average compared with raw model data.",
      },
    );
  }

  return attachReviewData(
    {
      id: crypto.randomUUID(),
      role: "assistant",
      kind: "suggestion",
      text: "I can help screen the mock company dataset by revenue, EBITDA margin, sector, or valuation multiples without modifying cells automatically.",
      pendingAction: {
        id: "draft-variance-summary",
        label: "Draft variance summary",
        description: "Adds a pending narrative summary for review. No cell values are changed.",
        impact: "visual-only",
      },
    },
    options,
    baseMeta,
  );
}
