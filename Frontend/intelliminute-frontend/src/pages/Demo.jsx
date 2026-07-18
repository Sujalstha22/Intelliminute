import UploadForm from "../components/UploadFormDemo.jsx";
import ResultCard from "../components/ResultCard";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SAMPLE_OUTPUTS = [
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    label: "Full transcript",
    desc: "Word-for-word with speaker labels.",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    label: "Action items",
    desc: "Every task and owner, ready to paste into your tracker.",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    label: "Key decisions",
    desc: "What was agreed, and why.",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "Summary",
    desc: "Three-sentence TL;DR for everyone who missed it.",
  },
];

const STEPS = [
  { num: "1", label: "Upload", sub: "Drop your MP3 or WAV" },
  { num: "2", label: "Process", sub: "AI reads the room" },
  { num: "3", label: "Receive", sub: "Minutes, done." },
];

const TESTIMONIALS = [
  {
    quote: "Cut my post-meeting admin from 40 minutes to about 90 seconds.",
    name: "Priya S.",
    role: "Product Manager",
  },
  {
    quote:
      "The action items it pulls out are genuinely better than my own notes.",
    name: "Tom K.",
    role: "Engineering Lead",
  },
  {
    quote:
      "I demoed this to my team and three people signed up before I finished talking.",
    name: "Layla H.",
    role: "Operations Director",
  },
];

export default function Demo() {
  const [processing, setProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state?.minutesData ?? null;

  const activeStep = result ? 2 : processing ? 1 : 0;

  const handleStartOver = () => {
    // Clear location state so the upload form reappears
    navigate("/minutes", { replace: true, state: {} });
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#2c2c2c]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Sans:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .anim-up { animation: fadeUp 0.6s cubic-bezier(0.2,0.8,0.2,1) both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.2s; }  .d4 { animation-delay: 0.28s; }

        .step-connector { flex: 1; height: 1px; background: #e8e3db; margin: 0 6px; }
        .step-bubble {
          width: 32px; height: 32px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          flex-shrink: 0; transition: background 0.3s, color 0.3s, border-color 0.3s;
        }
        .step-bubble.done   { background: #1a1a1a; color: #faf8f4; border: 1.5px solid #1a1a1a; }
        .step-bubble.active { background: #faf6f0; color: #8a6a3d;  border: 1.5px solid #c8a97e; }
        .step-bubble.idle   { background: #f7f4ef; color: #bbb;     border: 1.5px solid #e8e3db; }

        .output-chip {
          display: flex; align-items: flex-start; gap: 12px;
          background: #fff; border: 1px solid #ede9e2; border-radius: 14px;
          padding: 14px 16px; transition: box-shadow 0.2s, transform 0.2s;
        }
        .output-chip:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .output-icon {
          width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px;
          background: #f4f0e8; display: flex; align-items: center;
          justify-content: center; color: #c8a97e;
        }
        .testimonial-card {
          background: #fff; border: 1px solid #ede9e2; border-radius: 16px;
          padding: 20px; display: flex; flex-direction: column; gap: 14px;
        }
        .quote-mark { font-family: 'Playfair Display', serif; font-size: 40px; color: #e8ddd0; line-height: 1; }
        .demo-panel { background: #fff; border: 1px solid #ede9e2; border-radius: 24px; padding: 32px; }
        .result-enter { animation: fadeUp 0.5s ease both; }
        .divider { border: none; border-top: 1px solid #f0ede6; margin: 0; }
      `}</style>

      {/* ── Hero banner ── */}
      <div className="bg-[#f7f4ef] border-b border-[#ede9e2]">
        <div className="max-w-[1060px] mx-auto px-6 py-12 flex flex-col items-center text-center gap-4 anim-up d1">
          <span className="text-[12px] font-medium text-[#c8a97e] uppercase tracking-widest">
            Live Demo
          </span>
          <h1 className="font-playfair text-[clamp(30px,4vw,48px)] tracking-tight text-[#111] leading-tight">
            See it work on your recording.
          </h1>
          <p className="text-[16px] font-light text-[#666] max-w-[440px] leading-relaxed">
            Upload any meeting audio and get back a full transcript, action
            items, and key decisions.
          </p>

          {/* Step indicator */}
          <div className="flex items-center w-full max-w-[400px] mt-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`step-bubble ${i < activeStep ? "done" : i === activeStep ? "active" : "idle"}`}
                  >
                    {i < activeStep ? (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-[11.5px] font-medium ${i === activeStep ? "text-[#8a6a3d]" : i < activeStep ? "text-[#1a1a1a]" : "text-[#bbb]"}`}
                    >
                      {s.label}
                    </p>
                    <p className="text-[10.5px] text-[#bbb] leading-tight hidden sm:block">
                      {s.sub}
                    </p>
                  </div>
                </div>
                {i < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1060px] mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        {/* Left — upload or result */}
        <div className="flex flex-col gap-6 anim-up d2">
          {!result ? (
            <div className="demo-panel">
              <h2 className="font-playfair text-[22px] text-[#111] mb-1">
                Upload your recording
              </h2>
              <p className="text-[13.5px] text-[#999] font-light mb-6">
                MP3 or WAV · up to 500 MB · first 5 min free
              </p>

              <UploadForm setProcessing={setProcessing} />
            </div>
          ) : (
            <div className="result-enter">
              <button
                onClick={handleStartOver}
                style={{ fontFamily: "'Inter', sans-serif" }}
                className="mb-4 flex items-center gap-1.5 text-[12.5px] text-[#aaa] hover:text-[#8a6a3d] transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Upload another recording
              </button>
              <ResultCard data={result} />
            </div>
          )}
        </div>

        {/* Right — outputs + social proof */}
        <div className="flex flex-col gap-8 anim-up d3">
          <div>
            <p className="text-[11.5px] font-medium text-[#bbb] uppercase tracking-widest mb-4">
              What you'll receive
            </p>
            <div className="flex flex-col gap-3">
              {SAMPLE_OUTPUTS.map((o, i) => (
                <div key={i} className="output-chip">
                  <div className="output-icon">{o.icon}</div>
                  <div>
                    <p className="text-[13.5px] font-medium text-[#1a1a1a]">
                      {o.label}
                    </p>
                    <p className="text-[12.5px] text-[#999] mt-0.5 leading-relaxed">
                      {o.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#faf6f0] border border-[#f0ddb5] rounded-2xl px-4 py-4">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c8a97e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-[13px] font-medium text-[#8a6a3d]">
                Recording longer than 5 minutes?
              </p>
              <p className="text-[12.5px] text-[#b08050] mt-0.5 leading-relaxed">
                Pro plans unlock up to 3-hour recordings, speaker ID, and
                integrations.{" "}
                <a
                  href="/#pricing"
                  className="underline underline-offset-2 font-medium text-[#8a6a3d] hover:text-[#6b4f2a]"
                >
                  See plans →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Testimonials row ── */}
      <div className="border-t border-[#f0ede6] bg-white">
        <div className="max-w-[1060px] mx-auto px-6 py-14">
          <p className="text-[11.5px] font-medium text-[#bbb] uppercase tracking-widest mb-8 text-center">
            What people say
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="quote-mark">"</div>
                <p className="text-[13.5px] text-[#444] leading-relaxed -mt-3">
                  {t.quote}
                </p>
                <div className="flex items-center gap-2.5 mt-auto pt-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                    style={{ background: "#f4ece0", color: "#8a6a3d" }}
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-medium text-[#1a1a1a] leading-none">
                      {t.name}
                    </p>
                    <p className="text-[11.5px] text-[#aaa] mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#f0ede6]">
        <div className="max-w-[1060px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[#999] text-[12.5px]">
          <p>© {new Date().getFullYear()} IntelliMinute.</p>
          <p>Because you have better things to do than formatting notes.</p>
        </div>
      </footer>
    </div>
  );
}
