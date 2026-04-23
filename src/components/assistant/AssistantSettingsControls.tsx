import { useState } from "react";
import type { AssistantSettings } from "../../types";

type AssistantSettingsControlsProps = {
  onSettingsChange: (settings: AssistantSettings) => void;
  settings: AssistantSettings;
};

export function AssistantSettingsControls({
  onSettingsChange,
  settings,
}: AssistantSettingsControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleSetting = (setting: keyof AssistantSettings) => {
    onSettingsChange({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  return (
    <div className="assistant-settings-shell">
      <div className="assistant-settings-bar">
        <button
          aria-controls="assistant-settings-panel"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Hide assistant options" : "Show assistant options"}
          className="assistant-settings-trigger"
          onClick={() => setIsOpen((current) => !current)}
          title={isOpen ? "Hide assistant options" : "Show assistant options"}
          type="button"
        >
          <span className="assistant-settings-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M19.14 12.94a7.4 7.4 0 0 0 .05-.94 7.4 7.4 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.89 2h-3.78a.5.5 0 0 0-.49.41l-.36 2.54c-.58.23-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.72 8.47a.5.5 0 0 0 .12.63l2.03 1.58A7.4 7.4 0 0 0 4.81 12c0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.41h3.78a.5.5 0 0 0 .49-.41l.36-2.54c.58-.23 1.12-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.63zm-7.14 1.56A2.5 2.5 0 1 1 12 9.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="assistant-settings" aria-label="Assistant settings" id="assistant-settings-panel">
          <ToggleRow
            checked={settings.promptRefinement}
            label="Prompt Refinement"
            onChange={() => handleToggleSetting("promptRefinement")}
          />
          <ToggleRow
            checked={settings.anomalyDetection}
            label="Anomaly Detection"
            onChange={() => handleToggleSetting("anomalyDetection")}
          />
          <ToggleRow
            checked={settings.confidenceDisplay}
            label="Output Check / Confidence Display"
            onChange={() => handleToggleSetting("confidenceDisplay")}
          />
          <ToggleRow
            checked={!settings.showAiActions}
            label="Ignore AI action"
            onChange={() => handleToggleSetting("showAiActions")}
          />
          <button className="assistant-settings-close" onClick={() => setIsOpen(false)} type="button">
            Hide options
          </button>
        </div>
      )}
    </div>
  );
}

type ToggleRowProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
};

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input checked={checked} onChange={onChange} type="checkbox" />
    </label>
  );
}
