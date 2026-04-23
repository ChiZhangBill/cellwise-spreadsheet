import type { AssistantMessage, AssistantSettings, PendingAction } from "../types";
import { CellWiseLogo } from "./CellWiseLogo";
import { AssistantSettingsControls } from "./assistant/AssistantSettingsControls";
import { AssistantStatus } from "./assistant/AssistantStatus";
import { MessageCard } from "./assistant/MessageCard";
import { PromptInputBar } from "./PromptInputBar";

type RightAssistantPanelProps = {
  errorMessage?: string;
  isThinking: boolean;
  messages: AssistantMessage[];
  onClearHistory: () => void;
  onConfirmAction: (action: PendingAction) => void;
  onIgnoreAction: (action: PendingAction) => void;
  onRetry: () => void;
  onSettingsChange: (settings: AssistantSettings) => void;
  onStopAssistant: () => void;
  onSubmitPrompt: (prompt: string) => void;
  settings: AssistantSettings;
};

export function RightAssistantPanel({
  errorMessage,
  isThinking,
  messages,
  onClearHistory,
  onConfirmAction,
  onIgnoreAction,
  onRetry,
  onSettingsChange,
  onStopAssistant,
  onSubmitPrompt,
  settings,
}: RightAssistantPanelProps) {
  return (
    <aside className="assistant-panel" aria-label="AI assistant panel">
      <div className="assistant-header">
        <div className="assistant-brand">
          <CellWiseLogo size="compact" />
          <h2>CellWise</h2>
        </div>
        <div className="assistant-header-actions">
          <button
            className="assistant-clear-button"
            disabled={isThinking || messages.length === 0}
            onClick={onClearHistory}
            type="button"
          >
            Clear history
          </button>
          <AssistantSettingsControls onSettingsChange={onSettingsChange} settings={settings} />
        </div>
      </div>

      <div className="assistant-thread" aria-live="polite">
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onConfirmAction={onConfirmAction}
            onIgnoreAction={onIgnoreAction}
            showAiActions={settings.showAiActions}
          />
        ))}

        <AssistantStatus
          errorMessage={errorMessage}
          isThinking={isThinking}
          messageCount={messages.length}
          onRetry={onRetry}
          onStop={onStopAssistant}
        />
      </div>

      <PromptInputBar
        disabled={isThinking}
        onSubmit={onSubmitPrompt}
        promptRefinementEnabled={settings.promptRefinement}
      />
    </aside>
  );
}
