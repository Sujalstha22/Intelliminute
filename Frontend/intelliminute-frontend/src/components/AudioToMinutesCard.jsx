import { useState, useEffect, useRef } from "react";

const BARS = 28;
const LINES = [
  { w: "72%", delay: "0s" },
  { w: "55%", delay: "0.15s" },
  { w: "88%", delay: "0.3s" },
  { w: "40%", delay: "0.45s" },
  { w: "65%", delay: "0.6s" },
];

export default function AudioToMinutesCard() {
  const [phase, setPhase] = useState("audio");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const cycle = () => {
      setPhase("audio");
      setProgress(0);
      timerRef.current = setTimeout(() => {
        setPhase("processing");
        let p = 0;
        const tick = setInterval(() => {
          p += 2.2;
          setProgress(Math.min(p, 100));
          if (p >= 100) {
            clearInterval(tick);
            timerRef.current = setTimeout(() => {
              setPhase("minutes");
              timerRef.current = setTimeout(cycle, 3200);
            }, 300);
          }
        }, 55);
      }, 2200);
    };
    cycle();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      <style>{`
        @keyframes waveBar    { from{transform:scaleY(0.35)} to{transform:scaleY(1)} }
        @keyframes lineReveal { from{width:0;opacity:0} to{opacity:1} }
        @keyframes spinMed    { to{transform:rotate(360deg)} }
        @keyframes spinRev    { to{transform:rotate(-360deg)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .anim-fade-in       { animation: fadeIn  0.35s ease both; }
        .anim-spin-med      { animation: spinMed 1.1s linear infinite; }
        .anim-spin-slow-rev { animation: spinRev 1.8s linear infinite; }
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10 rounded-3xl blur-2xl opacity-30 bg-[#c8a97e] scale-90 translate-y-4" />

      {/* Card */}
      <div className="bg-white rounded-3xl border border-black/[0.07] shadow-[0_8px_40px_rgba(26,26,26,0.1)] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-black/[0.06] bg-[#faf8f4]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e05a4e]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#4caf7d]/80" />
          <span className="ml-auto text-[11px] text-[#aaa] font-dm-sans tracking-wide">
            {phase === "audio" && "meeting_recording.mp3"}
            {phase === "processing" && "analyzing…"}
            {phase === "minutes" && "minutes_ready.pdf"}
          </span>
        </div>

        <div className="px-6 py-6 min-h-[300px] flex flex-col justify-center gap-5">
          {/* ── PHASE: AUDIO ── */}
          {phase === "audio" && (
            <div className="flex flex-col items-center gap-5 anim-fade-in">
              <div className="flex items-center gap-[3px] h-16">
                {Array.from({ length: BARS }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-[#c8a97e]"
                    style={{
                      height: `${20 + Math.abs(Math.sin(i * 0.55)) * 44}%`,
                      animation: `waveBar 0.9s ease-in-out infinite alternate`,
                      animationDelay: `${(i * 35) % 700}ms`,
                      opacity: 0.6 + Math.abs(Math.sin(i * 0.4)) * 0.4,
                    }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#1a1a1a] font-dm-sans">
                  meeting_recording.mp3
                </p>
                <p className="text-[11px] text-[#aaa] font-dm-sans mt-0.5">
                  48:32 · 42.6 MB
                </p>
              </div>
              <div className="w-full bg-[#f0ebe3] rounded-full h-1">
                <div className="h-1 rounded-full bg-[#c8a97e] w-2/5" />
              </div>
              <div className="flex items-center justify-between w-full text-[10px] text-[#bbb] font-dm-sans">
                <span>19:24</span>
                <span>48:32</span>
              </div>
            </div>
          )}

          {/* ── PHASE: PROCESSING ── */}
          {phase === "processing" && (
            <div className="flex flex-col items-center gap-5 anim-fade-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[#c8a97e]/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c8a97e] anim-spin-med" />
                <div className="absolute inset-[6px] rounded-full border border-[#c8a97e]/30 border-b-[#c8a97e] anim-spin-slow-rev" />
                <div className="absolute inset-0 flex items-center justify-center text-lg">
                  🧠
                </div>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#1a1a1a] font-dm-sans">
                  Generating minutes…
                </p>
                <p className="text-[11px] text-[#aaa] font-dm-sans mt-0.5">
                  Extracting decisions & actions
                </p>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-[10px] text-[#bbb] font-dm-sans mb-1.5">
                  <span>Processing</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-[#f0ebe3] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c8a97e] to-[#a07850] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  "Transcribing",
                  "Summarising",
                  "Action items",
                  "Decisions",
                ].map((step, i) => (
                  <span
                    key={step}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-dm-sans transition-all duration-300 ${
                      progress > i * 25
                        ? "bg-[#1a1a1a] text-[#faf8f4]"
                        : "bg-[#f0ebe3] text-[#bbb]"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE: MINUTES ── */}
          {phase === "minutes" && (
            <div className="flex flex-col gap-3 anim-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#e8f5ee] flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-[#4caf7d]"
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
                <p className="text-[13px] font-medium text-[#1a1a1a] font-dm-sans">
                  Minutes ready
                </p>
                <span className="ml-auto text-[10px] text-[#4caf7d] font-dm-sans bg-[#e8f5ee] px-2 py-0.5 rounded-full">
                  Done
                </span>
              </div>

              <div className="bg-[#faf8f4] rounded-xl border border-black/[0.06] p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8a97e]" />
                  <span className="text-[11px] font-medium text-[#8a7560] uppercase tracking-widest font-dm-sans">
                    Summary
                  </span>
                </div>
                {LINES.slice(0, 3).map((l, i) => (
                  <div
                    key={i}
                    className="h-[6px] rounded-full bg-[#e8e2d8]"
                    style={{
                      width: l.w,
                      animation: `lineReveal 0.4s ease both`,
                      animationDelay: l.delay,
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#faf8f4] rounded-xl border border-black/[0.06] p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6b9ed2]" />
                    <span className="text-[10px] font-medium text-[#6b9ed2] uppercase tracking-wider font-dm-sans">
                      Actions
                    </span>
                  </div>
                  {LINES.slice(0, 3).map((l, i) => (
                    <div
                      key={i}
                      className="h-[5px] rounded-full bg-[#dce8f5]"
                      style={{
                        width: l.w,
                        animation: `lineReveal 0.4s ease both`,
                        animationDelay: `${0.2 + i * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="bg-[#faf8f4] rounded-xl border border-black/[0.06] p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d]" />
                    <span className="text-[10px] font-medium text-[#4caf7d] uppercase tracking-wider font-dm-sans">
                      Decisions
                    </span>
                  </div>
                  {LINES.slice(0, 3).map((l, i) => (
                    <div
                      key={i}
                      className="h-[5px] rounded-full bg-[#d8f0e4]"
                      style={{
                        width: l.w,
                        animation: `lineReveal 0.4s ease both`,
                        animationDelay: `${0.35 + i * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
