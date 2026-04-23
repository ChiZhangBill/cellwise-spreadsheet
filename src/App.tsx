import { useRef, useState } from "react";
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
import type { AssistantMessage, AssistantSettings, PendingAction, SheetCell } from "./types";

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
  const assistantAbortControllerRef = useRef<AbortController | null>(null);

  const handlePromptSubmit = async (prompt: string) => {
    const assistantMessageId = crypto.randomUUID();
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      kind: "plain",
      text: prompt,
    };

    assistantAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    assistantAbortControllerRef.current = abortController;
    const { signal } = abortController;

    setMessages((current) => [...current, userMessage]);
    setLastPrompt(prompt);
    setIsAssistantThinking(true);
    setAssistantError(undefined);

    try {
      const assistantMessage = await requestAssistantResponse(
        prompt,
        {
          anomalyDetection: settings.anomalyDetection,
          confidenceDisplay: settings.confidenceDisplay,
        },
        sheetCells,
        signal,
      );

      const streamingMessage: AssistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        kind: assistantMessage.kind,
        text: "",
        isStreaming: true,
      };

      setMessages((current) => [...current, streamingMessage]);
      await streamAssistantText(
        assistantMessage.text,
        (nextText) => {
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
        },
        signal,
      );

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
    } catch (error) {
      if (isAbortError(error)) {
        setMessages((current) => {
          const hasStreamingMessage = current.some((message) => message.id === assistantMessageId);
          if (hasStreamingMessage) {
            return current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text: message.text
                      ? `${message.text}\n\n[Stopped by user]`
                      : "[Stopped by user]",
                    isStreaming: false,
                  }
                : message,
            );
          }
          return [
            ...current,
            {
              id: assistantMessageId,
              role: "assistant",
              kind: "plain",
              text: "[Stopped by user]",
            },
          ];
        });
      } else {
        setAssistantError(
          "The assistant API could not complete this analysis. Your sheet and previous results were left unchanged.",
        );
      }
    } finally {
      if (assistantAbortControllerRef.current === abortController) {
        assistantAbortControllerRef.current = null;
      }
      setIsAssistantThinking(false);
    }
  };

  const handleStopAssistant = () => {
    assistantAbortControllerRef.current?.abort();
  };

  const handleConfirmAction = (action: PendingAction) => {
    let defaultFocus: string | undefined;

    setSheetCells((current) => {
      let next = current;

      if (action.sheetMutation?.type === "insert-row-after") {
        next = insertRowAfter(next, action.sheetMutation.anchorRow);
        defaultFocus = `A${action.sheetMutation.anchorRow + 1}`;
      } else if (action.sheetMutation?.type === "insert-column-after") {
        next = insertColumnAfter(next, action.sheetMutation.anchorColumn);
        const anchorIdx = columnLetterToIndex(action.sheetMutation.anchorColumn.toUpperCase());
        defaultFocus = `${columnIndexToLetter(anchorIdx + 1)}1`;
      }

      if (action.populateCells && action.populateCells.length > 0) {
        const writesById = new Map(action.populateCells.map((write) => [write.cellId.toUpperCase(), write]));
        const touched = new Set<string>();

        next = next.map((cell) => {
          const write = writesById.get(cell.id.toUpperCase());
          if (!write) {
            return cell;
          }
          touched.add(cell.id.toUpperCase());
          return {
            ...cell,
            value: write.value,
            variant: write.variant ?? cell.variant,
          };
        });

        const newCells: SheetCell[] = [];
        for (const write of action.populateCells) {
          const upperId = write.cellId.toUpperCase();
          if (touched.has(upperId)) {
            continue;
          }
          const parsed = parseCellAddress(upperId);
          if (!parsed) {
            continue;
          }
          newCells.push({
            id: upperId,
            column: parsed.column,
            row: parsed.row,
            value: write.value,
            variant: write.variant,
          });
        }

        if (newCells.length > 0) {
          next = [...next, ...newCells];
        }
      }

      return next;
    });

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

  const handleIgnoreAction = (action: PendingAction) => {
    setMessages((current) =>
      current.map((message) =>
        message.pendingAction?.id === action.id
          ? {
              ...message,
              pendingAction: undefined,
              text: `${message.text} Ignored: ${action.label}.`,
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
          onIgnoreAction={handleIgnoreAction}
          onSettingsChange={handleSettingsChange}
          onStopAssistant={handleStopAssistant}
          onSubmitPrompt={handlePromptSubmit}
          settings={settings}
        />
      </main>
    </div>
  );
}

async function streamAssistantText(
  text: string,
  onUpdate: (nextText: string) => void,
  signal?: AbortSignal,
) {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  let streamedText = "";

  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw createAbortError();
    }
    streamedText += chunk;
    onUpdate(streamedText);
    await wait(26, signal);
  }
}

function wait(durationMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, durationMs);
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(createAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createAbortError() {
  return new DOMException("Aborted", "AbortError");
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (error instanceof Error && error.name === "AbortError");
}

export default App;
