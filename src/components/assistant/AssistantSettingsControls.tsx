import type { AssistantSettings } from "../../types";

type AssistantSettingsControlsProps = {
  onSettingsChange: (settings: AssistantSettings) => void;
  settings: AssistantSettings;
};

export function AssistantSettingsControls({
  onSettingsChange,
  settings,
}: AssistantSettingsControlsProps) {
  const handleToggleSetting = (setting: keyof AssistantSettings) => {
    onSettingsChange({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  return (
    <div className="assistant-settings" aria-label="Assistant settings">
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
