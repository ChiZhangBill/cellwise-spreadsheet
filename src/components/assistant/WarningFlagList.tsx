import type { AnomalyFlag } from "../../types";

type WarningFlagListProps = {
  activeWarningId: string | null;
  dismissedWarningIds: string[];
  flags: AnomalyFlag[];
  onDismiss: (warningId: string) => void;
  onSelect: (warningId: string) => void;
};

export function WarningFlagList({
  activeWarningId,
  dismissedWarningIds,
  flags,
  onDismiss,
  onSelect,
}: WarningFlagListProps) {
  const visibleFlags = flags.filter((flag) => !dismissedWarningIds.includes(flag.id));

  if (visibleFlags.length === 0) {
    return null;
  }

  return (
    <div className="warning-list" aria-label="Financial anomaly warnings">
      {visibleFlags.map((flag) => (
        <div
          className={`warning-flag level-${flag.level} ${activeWarningId === flag.id ? "active" : ""}`}
          key={flag.id}
        >
          <button onClick={() => onSelect(flag.id)} type="button">
            <span>{flag.title}</span>
            <strong>{flag.targetLabel}</strong>
            <small>{flag.summary}</small>
            <em>{flag.reason}</em>
          </button>
          <button aria-label={`Dismiss ${flag.title}`} onClick={() => onDismiss(flag.id)} type="button">
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
