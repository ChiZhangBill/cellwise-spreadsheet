import { Router } from "express";
import { runAnomalyCheck } from "../services/agentBService";
import { sendRouteError } from "../utils/http";
import { readAnalysisText, readPrompt, readSheetSnapshot } from "../utils/validation";

export const anomalyCheckRouter = Router();

anomalyCheckRouter.post("/", async (req, res) => {
  try {
    const prompt = readPrompt(req);
    const analysisText = readAnalysisText(req);
    const sheet = readSheetSnapshot(req);
    res.json(await runAnomalyCheck({ analysisText, prompt, sheet }));
  } catch (error) {
    sendRouteError(res, error);
  }
});
