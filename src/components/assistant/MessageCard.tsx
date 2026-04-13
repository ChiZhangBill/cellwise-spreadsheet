import type { AssistantMessage, PendingAction } from "../../types";
import { AnalysisTransparency } from "./AnalysisTransparency";
import { WarningFlagList } from "./WarningFlagList";

type MessageCardProps = {
  activeWarningId: string | null;
  dismissedWarningIds: string[];
  message: AssistantMessage;
  onConfirmAction: (action: PendingAction) => void;
  onDismissWarning: (warningId: string) => void;
  onSelectWarning: (warningId: string) => void;
};

export function MessageCard({
  activeWarningId,
  dismissedWarningIds,
  message,
  onConfirmAction,
  onDismissWarning,
  onSelectWarning,
}: MessageCardProps) {
  const isHighlighted =
    Boolean(activeWarningId) && message.anomalyFlags?.some((flag) => flag.id === activeWarningId);

  return (
    <article
      className={`message-card ${message.role} ${message.kind} ${isHighlighted ? "highlighted-result" : ""}`}
    >
      <span className="message-label">{message.role === "assistant" ? "Assistant" : "You"}</span>
      <p>{message.text}</p>

      {message.anomalyFlags && (
        <WarningFlagList
          activeWarningId={activeWarningId}
          dismissedWarningIds={dismissedWarningIds}
          flags={message.anomalyFlags}
          onDismiss={onDismissWarning}
          onSelect={onSelectWarning}
        />
      )}

      {message.analysisMeta && <AnalysisTransparency analysisMeta={message.analysisMeta} />}

      {message.pendingAction && (
        <div className="pending-action">
          <div>
            <strong>{message.pendingAction.label}</strong>
            <p>{message.pendingAction.description}</p>
            <span>Impact: {message.pendingAction.impact}</span>
          </div>
          <button type="button" onClick={() => onConfirmAction(message.pendingAction!)}>
            Confirm
          </button>
        </div>
      )}
    </article>
  );
}
