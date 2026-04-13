import { Router } from "express";
import { runFinancialAnalysis } from "../services/agentAService";
import { sendRouteError } from "../utils/http";
import { readPrompt, readSheetSnapshot } from "../utils/validation";

export const financialAnalysisRouter = Router();

financialAnalysisRouter.post("/", async (req, res) => {
  try {
    const prompt = readPrompt(req);
    const sheet = readSheetSnapshot(req);
    res.json(await runFinancialAnalysis({ prompt, sheet }));
  } catch (error) {
    sendRouteError(res, error);
  }
});
