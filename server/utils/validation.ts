import type { Request } from "express";
import type { SheetSnapshot } from "../types/api";

export function readPrompt(req: Request) {
  const prompt = req.body?.prompt;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("A non-empty prompt is required.");
  }

  return prompt.trim();
}

export function readAnalysisText(req: Request) {
  const analysisText = req.body?.analysisText;

  if (typeof analysisText !== "string" || analysisText.trim().length === 0) {
    throw new Error("A non-empty analysisText value is required.");
  }

  return analysisText.trim();
}

export function readSheetSnapshot(req: Request): SheetSnapshot {
  const cells = req.body?.sheet?.cells;

  if (!Array.isArray(cells)) {
    return { cells: [] };
  }

  return {
    cells: cells
      .filter((cell) => typeof cell?.id === "string" && typeof cell?.value === "string")
      .slice(0, 200)
      .map((cell) => ({
        id: cell.id,
        value: cell.value,
      })),
  };
}
