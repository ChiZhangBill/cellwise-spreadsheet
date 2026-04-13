import { useState } from "react";
import { SpreadsheetGrid } from "./components/SpreadsheetGrid";
import { RightAssistantPanel } from "./components/RightAssistantPanel";
import { TopHeader } from "./components/TopHeader";
import { defaultAssistantSettings, initialAssistantMessages } from "./data/mockAssistantData";
import { createMockSheet } from "./data/mockSpreadsheet";
import { requestAssistantResponse } from "./services/assistantApi";
import { importSpreadsheetFile } from "./services/spreadsheetImport";
import type { AssistantMessage, AssistantSettings, PendingAction } from "./types";

function App() {
  // Main state flow:
  // 1. The grid owns editable sheet values locally in React state.
  // 2. The assistant owns a transcript of user prompts and API-backed analysis results.
  // 3. Settings gate optional Agent B calls before a response is generated.
  // 4. Confirmed actions are tracked, but the app still does not mutate the sheet automatically.
  const [messages, setMessages] = useState<AssistantMessage[]>(initialAssistantMessages);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [assistantError, setAssistantError] = useState<string | undefined>();
  const [confirmedActions, setConfirmedActions] = useState<PendingAction[]>([]);
  const [importStatus, setImportStatus] = useState<string | undefined>();
  const [lastPrompt, setLastPrompt] = useState<string | undefined>();
  const [sheetCells, setSheetCells] = useState(() => createMockSheet());
  const [settings, setSettings] = useState<AssistantSettings>(defaultAssistantSettings);

  const handlePromptSubmit = async (prompt: string) => {
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      kind: "plain",
      text: prompt,
    };

    setMessages((current) => [...current, userMessage]);
    setLastPrompt(prompt);
    setIsAssistantThinking(true);
    setAssistantError(undefined);

    try {
      const assistantMessage = await requestAssistantResponse(prompt, {
        anomalyDetection: settings.anomalyDetection,
        confidenceDisplay: settings.confidenceDisplay,
      }, sheetCells);

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setAssistantError(
        "The assistant API could not complete this analysis. Your sheet and previous results were left unchanged.",
      );
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const handleConfirmAction = (action: PendingAction) => {
    setConfirmedActions((current) => [...current, action]);
    setMessages((current) =>
      current.map((message) =>
        message.pendingAction?.id === action.id
          ? {
              ...message,
              pendingAction: undefined,
              text: `${message.text} Confirmed: ${action.label}.`,
            }
          : message,
      ),
    );
  };

  const handleCellValueChange = (cellId: string, value: string) => {
    setSheetCells((current) =>
      current.map((cell) => (cell.id === cellId ? { ...cell, value } : cell)),
    );
  };

  const handleSettingsChange = (nextSettings: AssistantSettings) => {
    setSettings(nextSettings);
  };

  const handleRetryAssistantRequest = () => {
    if (lastPrompt) {
      void handlePromptSubmit(lastPrompt);
    }
  };

  const handleFileImport = async (file: File) => {
    setImportStatus(`Importing ${file.name}...`);

    try {
      const result = await importSpreadsheetFile(file);
      setSheetCells(result.cells);
      setImportStatus(`Imported ${result.fileName} (${result.rowCount} rows)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import this spreadsheet.";
      setImportStatus(message);
    }
  };

  const handleClearSheet = () => {
    setSheetCells((current) =>
      current.map((cell) => ({
        ...cell,
        value: "",
        variant: undefined,
      })),
    );
    setImportStatus("Cleared all spreadsheet cell contents");
  };

  return (
    <div className="app-shell">
      <TopHeader
        confirmedActionCount={confirmedActions.length}
        importStatus={importStatus}
        onClearSheet={handleClearSheet}
        onFileImport={(file) => void handleFileImport(file)}
      />
      <main className="workspace-layout">
        <section className="sheet-workspace" aria-label="Spreadsheet workspace">
          <SpreadsheetGrid cells={sheetCells} onCellValueChange={handleCellValueChange} />
        </section>
        <RightAssistantPanel
          errorMessage={assistantError}
          isThinking={isAssistantThinking}
          onRetry={handleRetryAssistantRequest}
          messages={messages}
          onConfirmAction={handleConfirmAction}
          onSettingsChange={handleSettingsChange}
          onSubmitPrompt={handlePromptSubmit}
          settings={settings}
        />
      </main>
    </div>
  );
}

export default App;
