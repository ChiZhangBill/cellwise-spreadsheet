import type { AnalysisMeta } from "../../types";

type AnalysisTransparencyProps = {
  analysisMeta: AnalysisMeta;
};

export function AnalysisTransparency({ analysisMeta }: AnalysisTransparencyProps) {
  return (
    <div className="analysis-transparency">
      <div className={`confidence-pill level-${analysisMeta.abnormalityLevel}`}>
        {analysisMeta.confidenceLabel} confidence - {analysisMeta.confidenceScore}% confidence /{" "}
        {analysisMeta.abnormalityLevel} abnormality
      </div>
      <strong>Assumptions</strong>
      <ul>
        {analysisMeta.assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>
      <strong>Reason for warning</strong>
      <p>{analysisMeta.warningReason}</p>
    </div>
  );
}
