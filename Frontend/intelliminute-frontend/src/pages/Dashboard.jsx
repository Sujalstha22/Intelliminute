import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/authContext";
import SubscriptionModal from "../components/SubscriptionModal.jsx";

const FREE_LIMIT = 3;

export default function Dashboard() {
  const { user, logout, authFetch } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef();

  useEffect(() => {
    authFetch("/meetings")
      .then((r) => r.json())
      .then((data) => setMeetings(data || []))
      .catch(console.error);
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;

    const remaining = FREE_LIMIT - (user?.meeting_count || 0);
    if (remaining <= 0 && !user?.subscribed) {
      setShowSub(true);
      return;
    }

    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("audio", file);

    try {
      const r = await authFetch("/meetings/upload", {
        method: "POST",
        body: fd,
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Upload failed");
      setMeetings((prev) => [result.meeting, ...prev]);
      setSelected(result.meeting);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const usedCount = user?.meeting_count || 0;
  const isSubscribed = user?.subscribed;
  const usagePct = (Math.min(usedCount, FREE_LIMIT) / FREE_LIMIT) * 100;

  return (
    <div className="flex min-h-screen bg-[#f7f4ef] font-sans">
      {showSub && <SubscriptionModal onClose={() => setShowSub(false)} />}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col gap-4 bg-white border-r border-[#ede3d5] p-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#b58a5a] shrink-0" />
          <div>
            <p className="text-base font-bold text-[#1a1a1a] leading-none">
              IntelliMinute
            </p>
            <p className="text-[10px] text-[#999] mt-0.5">
              AI Meeting Intelligence
            </p>
          </div>
        </div>

        {/* User card */}
        <div className="flex items-center gap-2.5 bg-[#faf7f2] border border-[#ede3d5] rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-[#b58a5a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-[#888] truncate">{user?.email}</p>
          </div>
        </div>

        {/* Pro CTA */}
        {!isSubscribed && (
          <div
            className="rounded-xl p-3 text-white"
            style={{ background: "linear-gradient(135deg, #b58a5a, #d6b28a)" }}
          >
            <p className="text-[13px] font-bold mb-1">Upgrade to Pro</p>
            <p className="text-[11px] leading-relaxed opacity-95 mb-3">
              Unlimited meetings and smarter AI summaries.
            </p>
            <button
              onClick={() => setShowSub(true)}
              className="w-full bg-white text-[#8a6744] rounded-lg py-2 text-[11px] font-bold cursor-pointer border-0"
            >
              Subscribe
            </button>
          </div>
        )}

        {/* Usage bar */}
        {!isSubscribed && (
          <div className="bg-[#faf7f2] rounded-xl p-3">
            <div className="flex justify-between text-[11px] text-[#888] mb-1.5">
              <span>Usage</span>
              <span>
                {Math.min(usedCount, FREE_LIMIT)}/{FREE_LIMIT}
              </span>
            </div>
            <div className="h-1 bg-[#eadfce] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#b58a5a] rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Subscribed badge */}
        {isSubscribed && (
          <div className="bg-[#e9f6ec] text-[#2d7a43] rounded-xl p-3 text-center text-[11px] font-bold">
            Pro Subscriber
          </div>
        )}

        <button
          onClick={logout}
          className="mt-auto border border-[#ede3d5] bg-white rounded-xl p-3 text-[11px] text-[#1a1a1a] cursor-pointer hover:bg-[#faf7f2] transition-colors"
        >
          Sign Out
        </button>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-5 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Meetings</h1>
            <p className="text-[11px] text-[#888] mt-0.5">
              Manage and review your AI generated summaries
            </p>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-[#b58a5a] text-white px-4 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer border-0 disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {uploading ? "Uploading…" : "+ Upload Meeting"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#fff1f0] border border-[#ffc9c5] text-[#c0392b] rounded-xl p-3 text-xs mb-5">
            {error}
          </div>
        )}

        {/* Panels */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left panel — meeting list */}
          <div className="w-[260px] shrink-0 flex flex-col bg-white rounded-2xl border border-[#ede3d5] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-[#ede3d5]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#999]">
                Recent Meetings
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {meetings.length === 0 && (
                <p className="text-xs text-[#999] px-1 pt-1">
                  No meetings uploaded yet
                </p>
              )}

              {meetings.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={[
                    "w-full text-left bg-[#faf7f2] rounded-xl p-3 border transition-colors cursor-pointer",
                    selected?.id === m.id
                      ? "border-[#b58a5a] bg-white"
                      : "border-transparent hover:border-[#ede3d5]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                      {m.title || "Untitled Meeting"}
                    </span>
                    <span className="text-[10px] bg-[#eadfce] text-[#8a6744] px-2 py-0.5 rounded-full capitalize shrink-0">
                      {m.meeting_type || "general"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#999]">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel — detail */}
          <div className="flex-1 bg-white rounded-2xl border border-[#ede3d5] overflow-y-auto p-5 min-w-0">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-[13px] text-[#999]">
                Select a meeting to view its summary
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#1a1a1a] truncate">
                      {selected.title || "Untitled Meeting"}
                    </h2>
                    <p className="text-[11px] text-[#888] mt-1">
                      {selected.meeting_type || "general"} •{" "}
                      {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Confidence ring */}
                  {selected.quality_metrics && (
                    <div className="relative w-[72px] h-[72px] shrink-0">
                      <svg width="72" height="72" className="-rotate-90">
                        <circle
                          cx="36"
                          cy="36"
                          r="30"
                          stroke="#ede3d5"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="36"
                          cy="36"
                          r="30"
                          stroke="#b58a5a"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={188}
                          strokeDashoffset={
                            188 -
                            (188 *
                              (selected.quality_metrics.overall_confidence ??
                                0)) /
                              100
                          }
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[#8a6744]">
                        {selected.quality_metrics.overall_confidence ?? 0}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <Section label="Summary">
                  <p className="text-[13px] leading-[1.8] text-[#333]">
                    {Array.isArray(selected.summary)
                      ? selected.summary.join(" ")
                      : selected.summary}
                  </p>
                </Section>

                {/* Action items */}
                {selected.action_items?.length > 0 && (
                  <Section label="Action Items">
                    <ul className="m-0 pl-[18px] text-[13px] leading-[1.8] text-[#333]">
                      {selected.action_items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Decisions */}
                {selected.decisions?.length > 0 && (
                  <Section label="Decisions">
                    <ul className="m-0 pl-[18px] text-[13px] leading-[1.8] text-[#333]">
                      {selected.decisions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Warnings */}
                {selected.quality_metrics?.warnings?.length > 0 && (
                  <Section label="AI Warnings">
                    <div className="flex flex-col gap-2">
                      {selected.quality_metrics.warnings.map((w, i) => (
                        <div
                          key={i}
                          className="bg-[#fff4ea] border border-[#f2d1ae] text-[#9a5c16] rounded-xl px-3 py-2.5 text-xs"
                        >
                          {w}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* Shared section wrapper keeps label styling consistent */
function Section({ label, children }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2.5">
        {label}
      </p>
      {children}
    </div>
  );
}
