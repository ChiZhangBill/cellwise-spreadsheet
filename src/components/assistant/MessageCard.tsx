import { useState } from "react";
import type { ReactNode } from "react";
import type { AssistantMessage, PendingAction, WarningCategory } from "../../types";
import { AnalysisTransparency } from "./AnalysisTransparency";
import { WarningFlagList } from "./WarningFlagList";

type MessageCardProps = {
  message: AssistantMessage;
  onConfirmAction: (action: PendingAction) => void;
  onIgnoreAction: (action: PendingAction) => void;
};

export function MessageCard({ message, onConfirmAction, onIgnoreAction }: MessageCardProps) {
  const [activeFlagId, setActiveFlagId] = useState<string | undefined>();
  const activeFlag = message.anomalyFlags?.find((flag) => flag.id === activeFlagId);

  return (
    <article className={`message-card ${message.role} ${message.kind} ${message.isStreaming ? "streaming" : ""}`}>
      <span className="message-label">{message.role === "assistant" ? "Assistant" : "You"}</span>
      <p>
        {message.text
          ? renderHighlightedText(message.text, activeFlag?.excerpt, activeFlag?.category)
          : "Starting response"}
        {message.isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
      </p>

      {message.anomalyFlags && message.anomalyFlags.length > 0 && (
        <WarningFlagList
          activeFlagId={activeFlagId}
          flags={message.anomalyFlags}
          onSelectFlag={(flagId) => setActiveFlagId((current) => (current === flagId ? undefined : flagId))}
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
          <div className="pending-action-buttons">
            <button
              className="pending-action-ignore"
              type="button"
              onClick={() => onIgnoreAction(message.pendingAction!)}
            >
              Ignore
            </button>
            <button
              className="pending-action-confirm"
              type="button"
              onClick={() => onConfirmAction(message.pendingAction!)}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function renderHighlightedText(text: string, excerpt?: string, category?: WarningCategory) {
  if (!excerpt || !text.includes(excerpt)) {
    return text;
  }

  const segments = text.split(excerpt);

  return segments.flatMap<ReactNode>((segment, index) => {
    const nodes: ReactNode[] = [segment];

    if (index < segments.length - 1) {
      nodes.push(
        <mark className={`inline-highlight category-${category ?? "uncertainty"}`} key={`${excerpt}-${index}`}>
          {excerpt}
        </mark>,
      );
    }

    return nodes;
  });
}
