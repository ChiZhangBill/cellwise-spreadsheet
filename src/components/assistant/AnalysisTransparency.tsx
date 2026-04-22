import { useState } from "react";
import type { AnalysisMeta } from "../../types";

type AnalysisTransparencyProps = {
  analysisMeta: AnalysisMeta;
};

export function AnalysisTransparency({ analysisMeta }: AnalysisTransparencyProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const confidencePercent = normalizeConfidenceScore(analysisMeta.confidenceScore);

  return (
    <div className="analysis-transparency">
      <div className="analysis-transparency-header">
        <div className={`confidence-pill level-${analysisMeta.abnormalityLevel}`}>
          {analysisMeta.confidenceLabel} confidence - {confidencePercent}% confidence:{" "}
          {analysisMeta.abnormalityLevel} abnormality
        </div>
        <button
          aria-expanded={isDetailsVisible}
          className="analysis-transparency-toggle"
          onClick={() => setIsDetailsVisible((current) => !current)}
          type="button"
        >
          {isDetailsVisible ? "Hide" : "Show"}
        </button>
      </div>
      {isDetailsVisible && (
        <>
          <strong>Assumptions</strong>
          <ul>
            {analysisMeta.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <strong>Reason for warning</strong>
          <p>{analysisMeta.warningReason}</p>
        </>
      )}
    </div>
  );
}

function normalizeConfidenceScore(rawScore: number): number {
  if (!Number.isFinite(rawScore)) {
    return 0;
  }
  const scaled = rawScore > 0 && rawScore <= 1 ? rawScore * 100 : rawScore;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}
