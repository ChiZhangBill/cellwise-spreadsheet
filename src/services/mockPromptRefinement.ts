import type { PromptRefinement } from "../types";

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function refinePrompt(prompt: string, attempt = 0): Promise<PromptRefinement> {
  await delay(380);

  if (prompt.toLowerCase().includes("refinement failure")) {
    throw new Error("Mock prompt refinement failure");
  }

  const variants = [
    `Using the visible mock finance dataset, ${prompt.trim()} and explain the criteria before proposing any spreadsheet changes.`,
    `Analyze the selected company finance table for: ${prompt.trim()}. Return a concise finding, assumptions, confidence level, and any warnings that require user review.`,
  ];

  return {
    originalPrompt: prompt,
    refinedPrompt: variants[attempt % variants.length],
    rationale: "Clarifies the finance dataset scope and keeps any changes in a user-confirmed review step.",
  };
}
