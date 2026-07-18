import React from "react";

const SectionCard = ({ title, children }) => (
  <div className="bg-white border border-black/5 rounded-2xl p-5">
    <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-4">{title}</h3>

    <div className="text-[14px] text-[#444] leading-relaxed">{children}</div>
  </div>
);

const CircularConfidence = ({ value = 0 }) => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(Math.max(value, 0), 100);

  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 85) return "#22c55e";
    if (progress >= 65) return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 flex flex-col items-center">
      <p className="text-[11px] uppercase tracking-wider text-[#8c8c8c] mb-4">
        Overall Confidence
      </p>

      <div className="relative w-[120px] h-[120px] flex items-center justify-center">
        <svg width="120" height="120" className="rotate-[-90deg]">
          {/* background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#f1ede6"
            strokeWidth="10"
            fill="transparent"
          />

          {/* progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={getColor()}
            strokeWidth="10"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease",
            }}
          />
        </svg>

        {/* center text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-[#1a1a1a]">
            {progress}%
          </span>

          <span className="text-[11px] text-[#999] mt-[-2px]">confidence</span>
        </div>
      </div>

      {/* status */}
      <p
        className={`mt-4 text-[13px] font-medium ${
          progress >= 85
            ? "text-green-600"
            : progress >= 65
              ? "text-yellow-600"
              : "text-red-500"
        }`}
      >
        {progress >= 85
          ? "High Reliability"
          : progress >= 65
            ? "Moderate Reliability"
            : "Low Reliability"}
      </p>
    </div>
  );
};

const ResultCard = ({ data }) => {
  if (!data) return null;

  const {
    summary = [],
    transcript = "",
    action_items = [],
    decision_items = [],
    key_points = [],
    participants = [],
    dominant_speaker,
    quality_metrics = {},
  } = data;

  const { overall_confidence = 0, warnings = [] } = quality_metrics;

  return (
    <div className="flex flex-col gap-6">
      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-3">
          <SectionCard title="Meeting Summary">
            {Array.isArray(summary) ? (
              <ul className="list-disc pl-5 space-y-2">
                {summary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{summary}</p>
            )}
          </SectionCard>
        </div>

        {/* RIGHT CONFIDENCE */}
        <div className="lg:col-span-1">
          <CircularConfidence value={overall_confidence} />
        </div>
      </div>

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <SectionCard title="AI Warnings">
          <div className="flex flex-col gap-3">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className="bg-[#fff8f3] border border-[#f3d7bf] rounded-xl px-4 py-3 text-[13px] text-[#8a5a2b]"
              >
                {warning}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* KEY POINTS */}
      {key_points.length > 0 && (
        <SectionCard title="Key Points">
          <ul className="list-disc pl-5 space-y-2">
            {key_points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ACTION ITEMS */}
      {action_items.length > 0 && (
        <SectionCard title="Action Items">
          <ul className="space-y-3">
            {action_items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 bg-[#faf7f2] border border-[#f0e8dc] rounded-xl px-4 py-3"
              >
                <div className="w-5 h-5 rounded-full bg-[#c8a97e] text-white flex items-center justify-center text-[11px] mt-[1px]">
                  ✓
                </div>

                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* DECISIONS */}
      {decision_items.length > 0 && (
        <SectionCard title="Decisions">
          <ul className="list-disc pl-5 space-y-2">
            {decision_items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* PARTICIPANTS */}
      {participants.length > 0 && (
        <SectionCard title="Participants">
          <div className="flex flex-wrap gap-2">
            {participants.map((participant, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-[#f4ece0] text-[#8a6a3d] border border-[#e8ddd0] text-[12px]"
              >
                {participant}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* DOMINANT SPEAKER */}
      {dominant_speaker && (
        <SectionCard title="Dominant Speaker">
          <p>{dominant_speaker}</p>
        </SectionCard>
      )}

      {/* TRANSCRIPT */}
      <SectionCard title="Full Transcript">
        <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap text-[13.5px] leading-7 text-[#555] bg-[#fafafa] border border-black/5 rounded-xl p-4">
          {transcript || "No transcript available."}
        </div>
      </SectionCard>
    </div>
  );
};

export default ResultCard;
