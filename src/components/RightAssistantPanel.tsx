import { useState } from "react";
import { promptSuggestions } from "../data/mockAssistantData";
import type { AssistantMessage, AssistantSettings, PendingAction } from "../types";
import { AssistantSettingsControls } from "./assistant/AssistantSettingsControls";
import { AssistantStatus } from "./assistant/AssistantStatus";
import { MessageCard } from "./assistant/MessageCard";
import { PromptInputBar } from "./PromptInputBar";

type RightAssistantPanelProps = {
  errorMessage?: string;
  isThinking: boolean;
  messages: AssistantMessage[];
  onConfirmAction: (action: PendingAction) => void;
  onRetry: () => void;
  onSettingsChange: (settings: AssistantSettings) => void;
  onSubmitPrompt: (prompt: string) => void;
  settings: AssistantSettings;
};

export function RightAssistantPanel({
  errorMessage,
  isThinking,
  messages,
  onConfirmAction,
  onRetry,
  onSettingsChange,
  onSubmitPrompt,
  settings,
}: RightAssistantPanelProps) {
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);
  const [activeWarningId, setActiveWarningId] = useState<string | null>(null);

  const handleDismissWarning = (warningId: string) => {
    setDismissedWarningIds((current) => [...current, warningId]);
    if (activeWarningId === warningId) {
      setActiveWarningId(null);
    }
  };

  return (
    <aside className="assistant-panel" aria-label="AI assistant panel">
      <div className="assistant-header">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h2>AI Financial Assistant</h2>
          <p className="assistant-helper">
            Ask for analysis, proposed filters, or formula checks. Important changes stay pending until you confirm.
          </p>
        </div>
        <span className="assistant-state">Mock mode</span>
      </div>

      <AssistantSettingsControls onSettingsChange={onSettingsChange} settings={settings} />

      <div className="suggestion-strip" aria-label="Prompt suggestions">
        {promptSuggestions.map((suggestion) => (
          <button
            disabled={isThinking}
            key={suggestion}
            onClick={() => onSubmitPrompt(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="assistant-thread" aria-live="polite">
        {messages.map((message) => (
          <MessageCard
            activeWarningId={activeWarningId}
            dismissedWarningIds={dismissedWarningIds}
            key={message.id}
            message={message}
            onConfirmAction={onConfirmAction}
            onDismissWarning={handleDismissWarning}
            onSelectWarning={setActiveWarningId}
          />
        ))}

        <AssistantStatus
          errorMessage={errorMessage}
          isThinking={isThinking}
          messageCount={messages.length}
          onRetry={onRetry}
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
