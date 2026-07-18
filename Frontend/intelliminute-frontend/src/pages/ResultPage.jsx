import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import ResultCard from "../components/ResultCard";

const ResultPage = () => {
  const { id } = useParams();
  const { authFetch } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);

        const res = await authFetch(`/meetings/${id}`);
        const data = await res.json();

        console.log("RESULT PAGE RESPONSE:", data);

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch meeting");
        }

        setMeeting(data.meeting, data.analysis);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load result");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMeeting();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#777]">
        Loading result...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No meeting data found
      </div>
    );
  }

  const meetingTitle = meeting.title || "Untitled Meeting";
  const meetingType = meeting.meeting_type || "General";

  return (
    <div className="min-h-screen bg-[#f8f6f2] font-dm-sans px-6 py-8">
      {/* ───── HEADER ───── */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          {/* LEFT */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#c8a97e] font-medium">
              Meeting Minutes
            </p>

            <h1 className="text-[26px] font-serif-display text-[#1a1a1a] mt-1">
              {meetingTitle}
            </h1>

            <div className="flex items-center gap-3 mt-2">
              {/* TYPE */}
              <span className="px-3 py-1 text-xs rounded-full bg-[#f4ece0] text-[#8a6a3d] border border-[#e8ddd0]">
                {meetingType}
              </span>

              {/* STATUS */}
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                Completed
              </span>
            </div>
          </div>
          {/* RIGHT ACTIONS */}
          <div className="flex gap-2">
            {/* DOWNLOAD */}
            <button
              onClick={() => {
                const content = `
MEETING TITLE:
${meeting.title || meetingTitle || "Untitled Meeting"}

MEETING TYPE:
${meeting.meeting_type || meetingType || "General"}

-----------------------------------

SUMMARY:
${
  Array.isArray(meeting.summary)
    ? meeting.summary.map((s) => `• ${s}`).join("\n")
    : meeting.summary || "No summary available"
}

-----------------------------------

ACTION ITEMS:
${
  meeting.action_items?.length
    ? meeting.action_items.map((a) => `• ${a}`).join("\n")
    : "No action items"
}

-----------------------------------

DECISIONS:
${
  meeting.decision_items?.length
    ? meeting.decision_items.map((d) => `• ${d}`).join("\n")
    : "No decisions"
}

-----------------------------------

TRANSCRIPT:

${meeting.transcript || "No transcript available"}
`;

                const blob = new Blob([content], {
                  type: "text/plain;charset=utf-8",
                });

                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;

                const safeTitle = (
                  meeting.title ||
                  meetingTitle ||
                  "meeting"
                ).replace(/\s+/g, "_");

                a.download = `${safeTitle}_minutes.txt`;

                document.body.appendChild(a);
                a.click();

                document.body.removeChild(a);

                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-sm rounded-xl bg-white border border-black/10 hover:bg-black/5 transition-all"
            >
              Download
            </button>

            {/* SHARE */}
            <button
              onClick={async () => {
                const shareText = `
${meeting.title || meetingTitle || "Meeting Minutes"}

Summary:
${
  Array.isArray(meeting.summary)
    ? meeting.summary.join(" ")
    : meeting.summary || ""
}
`;

                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: meeting.title || meetingTitle || "Meeting Minutes",
                      text: shareText,
                      url: window.location.href,
                    });
                  } else {
                    await navigator.clipboard.writeText(shareText);

                    alert("Meeting summary copied to clipboard!");
                  }
                } catch (err) {
                  console.error("Share failed:", err);
                }
              }}
              className="px-4 py-2 text-sm rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2e2e2e] transition-all"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* ───── MAIN GRID ───── */}
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
        {/* MAIN CONTENT */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* RESULT CARD */}
          <ResultCard data={meeting} />

          {/* FUTURE SECTION */}
          <div className="bg-white border border-black/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-2">
              AI Insights (Coming Soon)
            </h3>

            <p className="text-sm text-[#888]">
              Sentiment analysis, speaker insights, and deeper meeting analytics
              will appear here.
            </p>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* QUICK INFO */}
          <div className="bg-white border border-black/5 rounded-2xl p-4">
            <h4 className="text-sm font-medium mb-3">Overview</h4>

            <div className="flex flex-col gap-2 text-sm text-[#555]">
              <div className="flex justify-between">
                <span>Type</span>
                <span>{meetingType}</span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-green-600">Completed</span>
              </div>

              <div className="flex justify-between">
                <span>Created</span>
                <span>
                  {meeting.created_at
                    ? new Date(meeting.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* TRANSCRIPT INFO */}
          <div className="bg-white border border-black/5 rounded-2xl p-4">
            <h4 className="text-sm font-medium mb-3">Transcript</h4>

            <div className="flex flex-col gap-2 text-sm text-[#666]">
              <div className="flex justify-between">
                <span>Words</span>
                <span>
                  {meeting.transcript
                    ? meeting.transcript.split(" ").length
                    : 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Action Items</span>
                <span>{meeting.action_items?.length || 0}</span>
              </div>

              <div className="flex justify-between">
                <span>Decisions</span>
                <span>{meeting.decision_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
