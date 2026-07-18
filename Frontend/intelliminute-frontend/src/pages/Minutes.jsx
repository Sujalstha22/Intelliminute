import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Minutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.minutesData;
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [actionsDone, setActionsDone] = useState({});

  const handleCopyAll = () => {
    if (!data) return;
    const { analysis, transcript } = data;
    const text = [
      "MEETING MINUTES",
      "",
      "SUMMARY",
      ...(analysis.summary || []).map((s) => `• ${s}`),
      "",
      "KEY POINTS",
      ...(analysis.key_points || []).map((s) => `• ${s}`),
      "",
      "ACTION ITEMS",
      ...(analysis.action_items || []).map((s) => `• ${s}`),
      "",
      "DECISIONS",
      ...(analysis.decisions || []).map((s) => `• ${s}`),
      "",
      "TRANSCRIPT",
      transcript,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopiedIndex("all");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">
            No minutes found
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            Upload a meeting recording to generate minutes.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-stone-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-stone-700 transition-colors"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const { transcript, analysis } = data;

  const sections = [
    {
      key: "summary",
      label: "Summary",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
          />
        </svg>
      ),
      items: analysis.summary || [],
      accent: "amber",
    },
    {
      key: "key_points",
      label: "Key points",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ),
      items: analysis.key_points || [],
      accent: "blue",
    },
    {
      key: "decisions",
      label: "Decisions",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      items: analysis.decisions || [],
      accent: "emerald",
    },
  ];

  const accentMap = {
    amber: {
      dot: "bg-amber-400",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      icon: "bg-amber-50 text-amber-600",
    },
    blue: {
      dot: "bg-blue-400",
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      icon: "bg-blue-50 text-blue-600",
    },
    emerald: {
      dot: "bg-emerald-400",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: "bg-emerald-50 text-emerald-600",
    },
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur border-b border-stone-200 px-6 py-3.5 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-1.5 font-serif text-base text-stone-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          IntelliMinute
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 text-sm text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            {copiedIndex === "all" ? (
              <>
                <svg
                  className="w-3.5 h-3.5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
                Copy all
              </>
            )}
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export PDF
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-medium tracking-widest uppercase text-stone-400 mb-2">
            Meeting minutes
          </p>
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">
            Your meeting, captured.
          </h1>
        </div>

        {/* Participants */}
        {analysis.participants?.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider mr-1">
              Participants
            </span>
            {analysis.participants.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-medium px-3 py-1 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {p}
              </span>
            ))}
          </div>
        )}

        {/* 3-column info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {sections.map(({ key, label, icon, items, accent }) => {
            const a = accentMap[accent];
            return (
              <div
                key={key}
                className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.icon}`}
                  >
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-stone-700">
                    {label}
                  </span>
                  <span
                    className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border ${a.badge}`}
                  >
                    {items.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {items.length === 0 ? (
                    <li className="text-sm text-stone-400 italic">
                      None recorded
                    </li>
                  ) : (
                    items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-stone-600 leading-relaxed"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`}
                        />
                        {item}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Action items — full width with checkboxes */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-stone-700">
              Action items
            </span>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-800 border-violet-200">
              {analysis.action_items?.length || 0}
            </span>
            <span className="text-xs text-stone-400">
              {Object.values(actionsDone).filter(Boolean).length} of{" "}
              {analysis.action_items?.length || 0} done
            </span>
          </div>
          {(analysis.action_items || []).length === 0 ? (
            <p className="text-sm text-stone-400 italic">
              No action items recorded
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-stone-100">
              {(analysis.action_items || []).map((item, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 py-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={!!actionsDone[i]}
                    onChange={() =>
                      setActionsDone((p) => ({ ...p, [i]: !p[i] }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 accent-stone-800 cursor-pointer flex-shrink-0"
                  />
                  <span
                    className={`text-sm leading-relaxed transition-colors ${actionsDone[i] ? "line-through text-stone-400" : "text-stone-700 group-hover:text-stone-900"}`}
                  >
                    {item}
                  </span>
                  {actionsDone[i] && (
                    <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                      Done
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Transcript collapsible */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-stone-700">
                Full transcript
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${showTranscript ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {showTranscript && (
            <div className="px-5 pb-6 border-t border-stone-100">
              <pre className="whitespace-pre-wrap text-sm text-stone-600 leading-7 mt-4 font-sans">
                {transcript}
              </pre>
            </div>
          )}
        </div>

        {/* Bottom back button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors underline underline-offset-4"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Minutes;
