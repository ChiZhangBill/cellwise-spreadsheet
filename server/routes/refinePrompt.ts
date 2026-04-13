import { Router } from "express";
import { runPromptRefinement } from "../services/agentBService";
import { sendRouteError } from "../utils/http";
import { readPrompt } from "../utils/validation";

export const refinePromptRouter = Router();

refinePromptRouter.post("/", async (req, res) => {
  try {
    const prompt = readPrompt(req);
    const attempt = typeof req.body?.attempt === "number" ? req.body.attempt : 0;
    res.json(await runPromptRefinement(prompt, attempt));
  } catch (error) {
    sendRouteError(res, error);
  }
});
