import type { AssistantMessage, AssistantSettings } from "../types";

export const defaultAssistantSettings: AssistantSettings = {
  promptRefinement: true,
  anomalyDetection: true,
  confidenceDisplay: true,
};

export const initialAssistantMessages: AssistantMessage[] = [
  {
    id: "greeting",
    role: "assistant",
    kind: "plain",
    text: "Hello! I'm your Excel assistant. I can help you with data analysis, formatting, and more. What would you like to do?",
  },
];

export const promptSuggestions = [
  "Calculate the NPV for our project cash flows",
  "Find revenue outliers in the data",
];
