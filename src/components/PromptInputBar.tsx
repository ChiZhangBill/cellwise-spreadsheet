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
  const [refinements, setRefinements] = useState<PromptRefinement[]>([]);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    submitPrompt(trimmedPrompt);
  };

  const submitPrompt = (nextPrompt: string) => {
    onSubmit(nextPrompt);
    setPrompt("");
    setRefinements([]);
    setRefinementError(null);
  };

  const handleRefinePrompt = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setIsRefining(true);
    setRefinementError(null);
    setRefinements([]);

    try {
      // Generate 3 refinement options
      const options = await Promise.all([
        refinePrompt(trimmedPrompt, 0),
        refinePrompt(trimmedPrompt, 1),
        refinePrompt(trimmedPrompt, 2),
      ]);
      setRefinements(options);
    } catch {
      setRefinementError("Prompt refinement is unavailable right now. You can still submit the original prompt.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectRefinement = (refinedPrompt: string) => {
    setPrompt(refinedPrompt);
    setRefinements([]);
  };

  const handleAcceptRefinement = (refinedPrompt: string) => {
    submitPrompt(refinedPrompt);
  };

  return (
    <form className="prompt-input-bar" onSubmit={handleSubmit}>
      <label htmlFor="assistant-prompt">Ask about this sheet</label>

      {refinementError && (
        <div className="refinement-error" role="alert">
          <p>{refinementError}</p>
        </div>
      )}

      {refinements.length > 0 && (
        <div className="refinement-options">
          <div className="refinement-header">
            <span className="refinement-label">Original:</span>
            <p className="refinement-original">{refinements[0].originalPrompt}</p>
          </div>

          <div className="refinement-choices">
            {refinements.map((refinement, index) => (
              <div key={index} className="refinement-option">
                <div className="refinement-option-content">
                  <span className="refinement-option-number">Option {index + 1}</span>
                  <p className="refinement-refined">{refinement.refinedPrompt}</p>
                  <p className="refinement-rationale">{refinement.rationale}</p>
                </div>
                <div className="refinement-option-actions">
                  <button
                    className="btn-accept"
                    disabled={disabled}
                    onClick={() => handleAcceptRefinement(refinement.refinedPrompt)}
                    type="button"
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn-edit"
                    disabled={disabled}
                    onClick={() => handleSelectRefinement(refinement.refinedPrompt)}
                    type="button"
                  >
                    ✎ Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-close-options"
            onClick={() => setRefinements([])}
            type="button"
          >
            Close
          </button>
        </div>
      )}

      <div className="prompt-row">
        <textarea
          disabled={disabled || isRefining}
          id="assistant-prompt"
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask about revenue, EBITDA margin, multiples, filters..."
          rows={3}
          value={prompt}
        />
        <div className="prompt-buttons">
          {promptRefinementEnabled && (
            <button
              className="btn-refine"
              disabled={disabled || isRefining || !prompt.trim()}
              onClick={handleRefinePrompt}
              type="button"
            >
              {isRefining ? "Refining..." : "Refinement"}
            </button>
          )}
          <button 
            className="btn-send"
            disabled={disabled || isRefining || !prompt.trim()} 
            type="submit"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
