# Finance Sheet AI

A Vite + React + TypeScript spreadsheet prototype with a right-side AI financial assistant panel.

The app now uses a lightweight local TypeScript backend so API keys never appear in the browser bundle. The frontend calls local `/api/*` endpoints, and the backend calls OpenRouter with two Gemini-backed agent roles.

## Agent Architecture

- Agent A: `google/gemini-2.5-pro`
  - Main financial execution engine
  - Comparable company screening, EV/EBITDA analysis, IRR and valuation-style reasoning
  - Endpoint: `POST /api/financial-analysis`

- Agent B: `google/gemini-2.5-flash`
  - Interaction and validation layer
  - Prompt refinement, anomaly/sanity checks, assumption extraction, confidence transparency
  - Endpoints:
    - `POST /api/refine-prompt`
    - `POST /api/anomaly-check`
    - `POST /api/extract-assumptions`

Shared automation is preserved: refinements are suggested, warnings are surfaced, and confidence/assumptions inform the user without replacing user judgment.

## Environment

Create `.env` from `.env.example`:

```powershell
copy .env.example .env
```

Fill in:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://127.0.0.1:5174
OPENROUTER_APP_NAME=Finance Sheet AI

AGENT_A_MODEL=google/gemini-2.5-pro
AGENT_B_MODEL=google/gemini-2.5-flash

PORT=8787
CLIENT_ORIGIN=http://127.0.0.1:5174
```

`.env` is ignored by Git.

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Terminal 1, start the backend:

```powershell
npm.cmd run dev:server
```

Terminal 2, start the frontend:

```powershell
npm.cmd run dev:client -- --host 127.0.0.1 --port 5174
```

Open:

```text
http://127.0.0.1:5174/
```

Build check:

```powershell
npm.cmd run build
```

## Project Structure

```text
server/
  index.ts
  config/
    openRouterModels.ts
    prompts.ts
  routes/
    anomalyCheck.ts
    extractAssumptions.ts
    financialAnalysis.ts
    refinePrompt.ts
  services/
    agentAService.ts
    agentBService.ts
    openRouterClient.ts
  types/
    api.ts
  utils/
    http.ts
    validation.ts

src/
  App.tsx
  components/
    SpreadsheetGrid.tsx
    RightAssistantPanel.tsx
    PromptInputBar.tsx
    TopHeader.tsx
    assistant/
      AnalysisTransparency.tsx
      AssistantSettingsControls.tsx
      AssistantStatus.tsx
      MessageCard.tsx
      WarningFlagList.tsx
  data/
    mockAssistantData.ts
    mockSpreadsheet.ts
  services/
    assistantApi.ts
    spreadsheetImport.ts
  styles/
    global.css
  types.ts
```

## Main State Flow

- `App.tsx` owns editable spreadsheet cells, assistant transcript, settings, loading/error state, confirmed actions, and file import status.
- `SpreadsheetGrid` receives controlled cell data and reports edits through `onCellValueChange`.
- `PromptInputBar` owns the local prompt draft and prompt-refinement confirmation flow. It never replaces the user's prompt unless the user clicks `Replace original prompt`.
- `assistantApi.ts` calls the local backend endpoints. It never sees the OpenRouter API key.
- `server/services/agentAService.ts` wraps the Gemini 2.5 Pro role through OpenRouter.
- `server/services/agentBService.ts` wraps the Gemini 2.5 Flash role through OpenRouter.
- `server/config/prompts.ts` centralizes the editable prompts.
- `server/config/openRouterModels.ts` centralizes model names and OpenRouter settings.

## Spreadsheet Import

- Click `Insert` in the top toolbar to upload a local `.csv`, `.xlsx`, or `.xls` file.
- Imported data is loaded into the visible 10-column by 20-row grid.
- Excel parsing is loaded on demand so the main app bundle stays lighter.
- Click `Clear` to remove all visible cell contents after an explicit browser confirmation.

## TODO

- Add request cancellation for in-flight assistant calls.
- Add richer runtime validation for model JSON responses.
- Add structured review states for pending spreadsheet actions before applying them.
- Connect anomaly flags to concrete cell ranges once the grid model supports range selection.
- Add tests for prompt refinement, warning dismissal, confidence display, controlled cell editing, and backend route validation.
