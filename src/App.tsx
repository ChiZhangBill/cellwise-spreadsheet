import { useState } from "react";
import { SpreadsheetGrid, type SpreadsheetFocusRequest } from "./components/SpreadsheetGrid";
import { RightAssistantPanel } from "./components/RightAssistantPanel";
import { TopHeader } from "./components/TopHeader";
import { defaultAssistantSettings, initialAssistantMessages } from "./data/mockAssistantData";
import { createMockSheet } from "./data/mockSpreadsheet";
import {
  columnIndexToLetter,
  columnLetterToIndex,
  insertColumnAfter,
  insertRowAfter,
  parseCellAddress,
} from "./data/sheetMutations";
import { requestAssistantResponse } from "./services/assistantApi";
import { importSpreadsheetFile } from "./services/spreadsheetImport";
import type { AssistantMessage, AssistantSettings, PendingAction } from "./types";

function App() {
  // Main state flow:
  // 1. The grid owns editable sheet values locally in React state.
  // 2. The assistant owns a transcript of user prompts and API-backed analysis results.
  // 3. Settings gate optional Agent B calls before a response is generated.
  // 4. Confirmed actions are tracked, but reviewed data changes stay out of the sheet.
  const [messages, setMessages] = useState<AssistantMessage[]>(initialAssistantMessages);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [assistantError, setAssistantError] = useState<string | undefined>();
  const [confirmedActions, setConfirmedActions] = useState<PendingAction[]>([]);
  const [importStatus, setImportStatus] = useState<string | undefined>();
  const [lastPrompt, setLastPrompt] = useState<string | undefined>();
  const [sheetCells, setSheetCells] = useState(() => createMockSheet());
  const [settings, setSettings] = useState<AssistantSettings>(defaultAssistantSettings);
  const [spreadsheetFocus, setSpreadsheetFocus] = useState<SpreadsheetFocusRequest | null>(null);

  const handlePromptSubmit = async (prompt: string) => {
    const assistantMessageId = crypto.randomUUID();
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

      const streamingMessage: AssistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        kind: assistantMessage.kind,
        text: "",
        isStreaming: true,
      };

      setMessages((current) => [...current, streamingMessage]);
      await streamAssistantText(assistantMessage.text, (nextText) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  text: nextText,
                }
              : message,
          ),
        );
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...assistantMessage,
                id: assistantMessageId,
                isStreaming: false,
              }
            : message,
        ),
      );
    } catch {
      setAssistantError(
        "The assistant API could not complete this analysis. Your sheet and previous results were left unchanged.",
      );
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const handleConfirmAction = (action: PendingAction) => {
    let defaultFocus: string | undefined;

    if (action.sheetMutation?.type === "insert-row-after") {
      setSheetCells((current) => insertRowAfter(current, action.sheetMutation.anchorRow));
      defaultFocus = `A${action.sheetMutation.anchorRow + 1}`;
    } else if (action.sheetMutation?.type === "insert-column-after") {
      setSheetCells((current) => insertColumnAfter(current, action.sheetMutation.anchorColumn));
      const anchorIdx = columnLetterToIndex(action.sheetMutation.anchorColumn.toUpperCase());
      defaultFocus = `${columnIndexToLetter(anchorIdx + 1)}1`;
    }

    const focusId = action.focusCellId ?? defaultFocus;
    if (focusId) {
      const highlight: SpreadsheetFocusRequest["highlight"] =
        action.sheetMutation?.type === "insert-column-after"
          ? "column"
          : action.sheetMutation?.type === "insert-row-after"
            ? "row"
            : undefined;
      setSpreadsheetFocus({ cellId: focusId, nonce: Date.now(), highlight });
    }

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
    setSheetCells((current) => {
      const existing = current.find((cell) => cell.id === cellId);
      if (existing) {
        return current.map((cell) => (cell.id === cellId ? { ...cell, value } : cell));
      }

      const parsed = parseCellAddress(cellId);
      if (!parsed) {
        return current;
      }

      return [
        ...current,
        {
          id: cellId,
          column: parsed.column,
          row: parsed.row,
          value,
        },
      ];
    });
  };

  const handleSettingsChange = (nextSettings: AssistantSettings) => {
    setSettings(nextSettings);
  };

  const handleRetryAssistantRequest = () => {
    if (lastPrompt) {
      void handlePromptSubmit(lastPrompt);
    }
  };

  const handleClearAssistantHistory = () => {
    setMessages([]);
    setLastPrompt(undefined);
    setAssistantError(undefined);
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
          <SpreadsheetGrid
            cells={sheetCells}
            focusRequest={spreadsheetFocus}
            onCellValueChange={handleCellValueChange}
            onFocusRequestComplete={() => setSpreadsheetFocus(null)}
          />
        </section>
        <RightAssistantPanel
          errorMessage={assistantError}
          isThinking={isAssistantThinking}
          onClearHistory={handleClearAssistantHistory}
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

async function streamAssistantText(text: string, onUpdate: (nextText: string) => void) {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  let streamedText = "";

  for (const chunk of chunks) {
    streamedText += chunk;
    onUpdate(streamedText);
    await wait(26);
  }
}

function wait(durationMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

export default App;
