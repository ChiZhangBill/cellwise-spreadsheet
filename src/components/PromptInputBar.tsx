import { FormEvent, useState } from "react";
import { refinePrompt } from "../services/assistantApi";
import type { PromptRefinement } from "../types";

type PromptInputBarProps = {
  disabled?: boolean;
  promptRefinementEnabled: boolean;
  onSubmit: (prompt: string) => void;
};

export function PromptInputBar({
  disabled = false,
  onSubmit,
  promptRefinementEnabled,
}: PromptInputBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinement, setRefinement] = useState<PromptRefinement | null>(null);
  const [refinementAttempt, setRefinementAttempt] = useState(0);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [reviewedPrompt, setReviewedPrompt] = useState<string | null>(null);
  const [showRefinementConfirm, setShowRefinementConfirm] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    if (promptRefinementEnabled && reviewedPrompt !== trimmedPrompt) {
      setRefinement(null);
      setRefinementError(null);
      setShowRefinementConfirm(true);
      return;
    }

    submitPrompt(trimmedPrompt);
  };

  const submitPrompt = (nextPrompt: string) => {
    onSubmit(nextPrompt);
    setPrompt("");
    setRefinement(null);
    setRefinementError(null);
    setRefinementAttempt(0);
    setReviewedPrompt(null);
    setShowRefinementConfirm(false);
  };

  const handleRefinePrompt = async (attempt = refinementAttempt) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setShowRefinementConfirm(false);
    setIsRefining(true);
    setRefinementError(null);

    try {
      const nextRefinement = await refinePrompt(trimmedPrompt, attempt);
      setRefinement(nextRefinement);
      setRefinementAttempt(attempt);
      setReviewedPrompt(trimmedPrompt);
    } catch {
      setRefinementError("Prompt refinement is unavailable right now. You can still submit the original prompt.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleRegenerate = () => {
    const nextAttempt = refinementAttempt + 1;
    setRefinementAttempt(nextAttempt);
    void handleRefinePrompt(nextAttempt);
  };

  return (
    <form className="prompt-input-bar" onSubmit={handleSubmit}>
      <label htmlFor="assistant-prompt">Ask about this sheet</label>
      {showRefinementConfirm && (
        <div className="refinement-confirm">
          <p>Optimize prompt using plug-in LLM?</p>
          <div>
            <button disabled={disabled || isRefining} onClick={() => void handleRefinePrompt()} type="button">
              Yes, suggest refinement
            </button>
            <button disabled={disabled || isRefining} onClick={() => submitPrompt(prompt.trim())} type="button">
              No, submit original
            </button>
          </div>
        </div>
      )}

      {refinementError && (
        <div className="refinement-error" role="alert">
          <p>{refinementError}</p>
          <button disabled={disabled || isRefining} onClick={() => submitPrompt(prompt.trim())} type="button">
            Submit original
          </button>
        </div>
      )}

      {refinement && (
        <div className="refinement-card">
          <span>Refined prompt suggestion</span>
          <p>{refinement.refinedPrompt}</p>
          <small>{refinement.rationale}</small>
          <div>
            <button
              disabled={disabled || isRefining}
              onClick={() => {
                setPrompt(refinement.refinedPrompt);
                setReviewedPrompt(refinement.refinedPrompt);
                setRefinement(null);
                setRefinementError(null);
                setShowRefinementConfirm(false);
              }}
              type="button"
            >
              Replace original prompt
            </button>
            <button disabled={disabled || isRefining} onClick={handleRegenerate} type="button">
              Regenerate
            </button>
            <button
              disabled={disabled || isRefining}
              onClick={() => {
                setReviewedPrompt(prompt.trim());
                setRefinement(null);
                setRefinementError(null);
                setShowRefinementConfirm(false);
              }}
              type="button"
            >
              Ignore
            </button>
          </div>
        </div>
      )}

      <div className="prompt-row">
        <textarea
          disabled={disabled || isRefining}
          id="assistant-prompt"
          onChange={(event) => {
            setPrompt(event.target.value);
            setShowRefinementConfirm(false);
          }}
          placeholder="Ask about revenue, EBITDA margin, multiples, filters..."
          rows={3}
          value={prompt}
        />
        <button disabled={disabled || isRefining || !prompt.trim()} type="submit">
          {isRefining ? "Refining" : "Send"}
        </button>
      </div>
    </form>
  );
}
