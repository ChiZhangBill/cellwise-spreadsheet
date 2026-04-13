import type { AssistantMessage, AssistantSettings } from "../types";

export const defaultAssistantSettings: AssistantSettings = {
  promptRefinement: true,
  anomalyDetection: true,
  confidenceDisplay: true,
};

export const initialAssistantMessages: AssistantMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    kind: "suggestion",
    text: "I can help review revenue trends, flag unusual costs, or draft formulas. I will ask before applying important changes.",
    pendingAction: {
      id: "format-currency",
      label: "Format revenue as currency",
      description: "Applies a currency display format to the revenue columns after you confirm.",
      impact: "visual-only",
    },
  },
];

export const promptSuggestions = [
  "Filter healthcare IT companies",
  "Calculate EV/EBITDA multiples",
  "Find revenue outliers",
  "What is the average EBITDA margin?",
];
