import { Router } from "express";
import { runAssumptionExtraction } from "../services/agentBService";
import { sendRouteError } from "../utils/http";
import { readAnalysisText, readPrompt } from "../utils/validation";

export const extractAssumptionsRouter = Router();

extractAssumptionsRouter.post("/", async (req, res) => {
  try {
    const prompt = readPrompt(req);
    const analysisText = readAnalysisText(req);
    res.json(await runAssumptionExtraction({ analysisText, prompt }));
  } catch (error) {
    sendRouteError(res, error);
  }
});
