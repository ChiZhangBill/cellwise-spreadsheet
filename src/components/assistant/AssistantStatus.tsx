import { useEffect, useState } from "react";

type AssistantStatusProps = {
  errorMessage?: string;
  isThinking: boolean;
  messageCount: number;
  onRetry: () => void;
  onStop: () => void;
};

const thinkingSteps = [
  "Reading the spreadsheet and your prompt",
  "Checking financial metrics and assumptions",
  "Drafting the analysis response",
  "Preparing warning flags and confidence notes",
];

export function AssistantStatus({ errorMessage, isThinking, messageCount, onRetry, onStop }: AssistantStatusProps) {
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setThinkingStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setThinkingStepIndex((current) => (current + 1) % thinkingSteps.length);
    }, 1600);

    return () => window.clearInterval(intervalId);
  }, [isThinking]);

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
        <p>{thinkingSteps[thinkingStepIndex]}</p>
        <button className="assistant-stop-button" onClick={onStop} type="button">
          Stop
        </button>
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
