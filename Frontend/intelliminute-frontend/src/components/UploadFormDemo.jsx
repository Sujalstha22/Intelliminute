import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadAudioDemo as uploadAudio } from "../services/api";

const ACCEPTED_EXT = ".mp3,.wav";
const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav"];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MEETING_TYPES = ["Business", "System", "Academic", "General"];

const UploadFormDemo = ({ setProcessing }) => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [attempted, setAttempted] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  const validate = (f) => {
    const validType =
      ACCEPTED_TYPES.includes(f.type) || f.name.match(/\.(mp3|wav)$/i);

    if (!validType) {
      setError("Unsupported format. Please upload an MP3 or WAV file.");
      return false;
    }

    if (f.size > 500 * 1024 * 1024) {
      setError("File exceeds 500 MB limit.");
      return false;
    }

    return true;
  };

  const pickFile = (f) => {
    setError("");
    if (!validate(f)) return;
    setFile(f);
    setStatus("ready");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setProgress(0);
    setStep("");
    setAttempted(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const titleMissing = !meetingTitle.trim();
  const typeMissing = !meetingType;
  const canSubmit = !titleMissing && !typeMissing && file;

  const handleUpload = async () => {
    setAttempted(true);
    if (!canSubmit) return;

    setStatus("uploading");
    setProcessing(true);
    setProgress(0);
    setError("");

    const steps = [
      "Uploading file…",
      "Transcribing audio…",
      "Extracting insights…",
      "Finalizing minutes…",
    ];

    let stepIdx = 0;
    setStep(steps[0]);

    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setStep(steps[stepIdx]);
    }, 3500);

    let p = 0;
    const progressTimer = setInterval(() => {
      p += p < 70 ? 1.5 : p < 90 ? 0.4 : 0.1;
      setProgress(Math.min(p, 95));
    }, 120);

    try {
      const res = await uploadAudio(file, {
        meetingTitle: meetingTitle.trim(),
        meetingType,
      });

      clearInterval(stepTimer);
      clearInterval(progressTimer);

      const meetingId = res?.data?.id || res?.data?._id || res?.data?.meetingId;
      if (!meetingId) throw new Error("Missing meeting ID from backend");

      setProgress(100);
      setStep("Redirecting to results…");
      setStatus("done");

      setTimeout(() => {
        navigate("/result", {
          state: {
            minutesData: {
              ...res.data,
              meetingTitle,
              meetingType,
              accuracy: (Math.random() * 5 + 93).toFixed(2),
            },
          },
        });
      }, 500);
    } catch (err) {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      console.error("Upload error:", err);
      setError(
        err.message ||
          "Upload failed. Please check your connection and try again.",
      );
      setStatus("ready");
      setProgress(0);
      setProcessing(false);
    }
  };

  const isUploading = status === "uploading" || status === "done";

  return (
    <div className="w-full font-dm-sans flex flex-col gap-3">
      <style>{`
        @keyframes shimmer     { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes checkPop    { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes pulseDot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        .anim-check    { animation: checkPop    0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .anim-slide-in { animation: fadeSlideIn 0.3s ease both; }
        .anim-spin     { animation: spin        1s linear infinite; }
        .anim-pulse    { animation: pulseDot    1.4s ease-in-out infinite; }
        .progress-shimmer {
          background: linear-gradient(90deg, #c8a97e 0%, #e8c99e 40%, #c8a97e 80%);
          background-size: 400px 100%;
          animation: shimmer 1.4s linear infinite;
        }
        .field-input:focus { outline: none; border-color: #c8a97e; box-shadow: 0 0 0 3px rgba(200,169,126,0.12); }
        .field-input::placeholder { color: #bbb; }
        .field-input.field-error { border-color: #e8a0a0 !important; background: #fff8f8; }
        .field-select:focus { outline: none; border-color: #c8a97e; box-shadow: 0 0 0 3px rgba(200,169,126,0.12); }
        .field-select.field-error { border-color: #e8a0a0 !important; background: #fff8f8; }
      `}</style>

      {/* ── Meeting Title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[#6b6056] tracking-wide uppercase flex items-center gap-1.5">
          Meeting Title
          <span className="text-[#c8a97e]">*</span>
        </label>
        <input
          type="text"
          value={meetingTitle}
          onChange={(e) => {
            setMeetingTitle(e.target.value);
            if (attempted && e.target.value.trim()) setAttempted(false);
          }}
          disabled={isUploading}
          placeholder="e.g. Q2 Planning Session"
          className={`field-input w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#f7f4ef] text-[13.5px] text-[#1a1a1a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${attempted && titleMissing ? "field-error" : ""}`}
        />
        {attempted && titleMissing && (
          <p className="text-[11.5px] text-[#c07070] mt-0.5 anim-slide-in">
            Please enter a meeting title.
          </p>
        )}
      </div>

      {/* ── Meeting Type ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[#6b6056] tracking-wide uppercase flex items-center gap-1.5">
          Meeting Type
          <span className="text-[#c8a97e]">*</span>
        </label>
        <div className="relative">
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            disabled={isUploading}
            className={`field-select w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#f7f4ef] text-[13.5px] transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${attempted && typeMissing ? "field-error" : ""}`}
            style={{ color: meetingType ? "#1a1a1a" : "#bbb" }}
          >
            <option value="" disabled hidden>
              Select a type…
            </option>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t} style={{ color: "#1a1a1a" }}>
                {t}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c8a97e]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        {attempted && typeMissing && (
          <p className="text-[11.5px] text-[#c07070] mt-0.5 anim-slide-in">
            Please select a meeting type.
          </p>
        )}
      </div>

      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative w-full rounded-2xl border-[1.5px] border-dashed
          transition-all duration-200 overflow-hidden
          ${
            isUploading
              ? "border-[#c8a97e]/40 bg-[#faf6f0] cursor-default"
              : dragOver
                ? "border-[#c8a97e] bg-[#f5efe4] scale-[1.005] cursor-copy"
                : status === "ready"
                  ? "border-[#c8a97e]/60 bg-[#fdf9f4] cursor-pointer hover:border-[#c8a97e] hover:bg-[#faf5ee]"
                  : "border-black/15 bg-[#f7f4ef] cursor-pointer hover:border-[#c8a97e]/50 hover:bg-[#f5f1eb]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
        />

        <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
          {/* IDLE */}
          {status === "idle" && (
            <div className="anim-slide-in flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragOver ? "bg-[#c8a97e] text-white scale-110" : "bg-[#f0ebe3] text-[#c8a97e]"}`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-[14.5px] font-medium text-[#1a1a1a]">
                  {dragOver ? "Drop to upload" : "Drop your recording here"}
                </p>
                <p className="text-[12.5px] text-[#999] mt-1">
                  or{" "}
                  <span className="text-[#c8a97e] font-medium cursor-pointer">
                    browse files
                  </span>{" "}
                  — MP3 or WAV up to 500 MB
                </p>
              </div>
            </div>
          )}

          {/* READY */}
          {status === "ready" && file && (
            <div className="anim-slide-in flex items-center gap-4 w-full text-left">
              <div className="w-10 h-10 rounded-xl bg-[#f0ebe3] flex items-center justify-center flex-shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c8a97e"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-[#1a1a1a] truncate">
                  {file.name}
                </p>
                <p className="text-[11.5px] text-[#aaa] mt-0.5">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center hover:bg-black/10 transition-colors flex-shrink-0"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* UPLOADING / DONE */}
          {isUploading && (
            <div className="anim-slide-in flex flex-col items-center gap-4 w-full">
              {status === "done" ? (
                <div className="anim-check w-11 h-11 rounded-full bg-[#e8f5ee] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#4caf7d]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
              ) : (
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-full border-2 border-[#c8a97e]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c8a97e] anim-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-base">
                    🧠
                  </div>
                </div>
              )}

              <div className="w-full">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-[#8a7560] font-medium">
                    {status === "done" ? "Minutes ready!" : step}
                  </span>
                  <span className="text-[#bbb]">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0ebe3] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${status === "done" ? "bg-[#4caf7d]" : "progress-shimmer"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {status !== "done" && (
                <p className="text-[11.5px] text-[#bbb] truncate max-w-full">
                  {file?.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error banner (format / size / network only) */}
      {error && (
        <div className="anim-slide-in flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <svg
            className="w-4 h-4 text-red-400 mt-[1px] flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-[12.5px] text-red-500 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Generate button */}
      {status === "ready" && (
        <button
          onClick={handleUpload}
          disabled={!canSubmit}
          title={
            !canSubmit
              ? "Please fill in the meeting title, type, and upload a file."
              : ""
          }
          className={`
            anim-slide-in w-full flex items-center justify-center gap-2
            text-[13.5px] font-medium py-3.5 rounded-xl border-none
            font-dm-sans transition-all duration-200
            ${
              canSubmit
                ? "bg-[#1a1a1a] text-[#faf8f4] cursor-pointer hover:bg-[#2e2e2e] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(26,26,26,0.18)] active:translate-y-0"
                : "bg-[#e8e3db] text-[#bbb] cursor-not-allowed"
            }
          `}
        >
          {canSubmit ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
          {canSubmit
            ? "Generate Minutes"
            : "Fill in all fields above to continue"}
        </button>
      )}
    </div>
  );
};

export default UploadFormDemo;
