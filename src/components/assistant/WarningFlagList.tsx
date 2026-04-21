import { useState } from "react";
import type { AnomalyFlag } from "../../types";

type WarningFlagListProps = {
  activeFlagId?: string;
  flags: AnomalyFlag[];
  onSelectFlag: (flagId: string) => void;
};

export function WarningFlagList({ activeFlagId, flags, onSelectFlag }: WarningFlagListProps) {
  const [expandedFlagIds, setExpandedFlagIds] = useState<string[]>([]);

  if (flags.length === 0) {
    return null;
  }

  return (
    <section className="warning-list" aria-label="Financial anomaly warnings">
      {flags.map((flag) => (
        <div className={`warning-flag category-${flag.category} ${activeFlagId === flag.id ? "active" : ""}`} key={flag.id}>
          <button className="warning-flag-select" onClick={() => onSelectFlag(flag.id)} type="button">
            <span className="warning-chip">{flag.label}</span>
            <p className={expandedFlagIds.includes(flag.id) ? "expanded" : undefined}>{flag.explanation}</p>
          </button>
          {flag.explanation.length > 95 && (
            <button
              className="warning-toggle"
              onClick={() =>
                setExpandedFlagIds((current) =>
                  current.includes(flag.id) ? current.filter((id) => id !== flag.id) : [...current, flag.id],
                )
              }
              type="button"
            >
              {expandedFlagIds.includes(flag.id) ? "Show less" : "View more"}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
