type AssistantStatusProps = {
  errorMessage?: string;
  isThinking: boolean;
  messageCount: number;
  onRetry: () => void;
};

export function AssistantStatus({ errorMessage, isThinking, messageCount, onRetry }: AssistantStatusProps) {
  if (errorMessage) {
    return (
      <div className="assistant-status error" role="alert">
        <strong>Analysis could not be generated</strong>
        <p>{errorMessage}</p>
        <button onClick={onRetry} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className="message-card assistant loading-card">
        <span className="message-label">Assistant</span>
        <p>Reviewing the mock sheet...</p>
      </div>
    );
  }

  if (messageCount === 0) {
    return (
      <div className="assistant-status empty">
        <strong>No analysis yet</strong>
        <p>Ask about revenue, EBITDA margin, valuation multiples, or sector filters to begin.</p>
      </div>
    );
  }

  return null;
}
