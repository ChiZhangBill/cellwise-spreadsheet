export const openRouterConfig = {
  baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  siteUrl: process.env.OPENROUTER_SITE_URL ?? "http://127.0.0.1:5174",
  appName: process.env.OPENROUTER_APP_NAME ?? "Finance Sheet AI",
  agentA: {
    label: "Agent A",
    model: process.env.AGENT_A_MODEL ?? "google/gemini-2.5-pro",
  },
  agentB: {
    label: "Agent B",
    model: process.env.AGENT_B_MODEL ?? "google/gemini-2.5-flash",
  },
};
