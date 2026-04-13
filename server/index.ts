import "dotenv/config";
import cors from "cors";
import express from "express";
import { anomalyCheckRouter } from "./routes/anomalyCheck";
import { extractAssumptionsRouter } from "./routes/extractAssumptions";
import { financialAnalysisRouter } from "./routes/financialAnalysis";
import { refinePromptRouter } from "./routes/refinePrompt";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:5174";

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/refine-prompt", refinePromptRouter);
app.use("/api/financial-analysis", financialAnalysisRouter);
app.use("/api/anomaly-check", anomalyCheckRouter);
app.use("/api/extract-assumptions", extractAssumptionsRouter);

app.listen(port, "127.0.0.1", () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
