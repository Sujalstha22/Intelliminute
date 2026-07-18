import { useState, useRef } from "react";
import UploadForm from "../components/UploadForm";
import SubscriptionModal from "../components/SubscriptionModal";
import AudioToMinutesCard from "../components/AudioToMinutesCard";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    num: "01",
    title: "Transcribe instantly",
    desc: "Drop in your audio file and get an accurate transcript in seconds. No waiting around.",
  },
  {
    num: "02",
    title: "Extract the core",
    desc: "We pull out the actual action items and decisions. Just what you need to move forward, nothing you don't.",
  },
  {
    num: "03",
    title: "Take it with you",
    desc: "Copy to your clipboard, grab a PDF, or drop it into Notion. Your notes belong wherever you work.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    badge: null,
    limit: "3 meetings included",
    perks: [
      "3 AI meeting summaries",
      "Full transcription",
      "Action items & decisions",
      "PDF & clipboard export",
    ],
    cta: "Get started free",
    note: null,
  },
  {
    name: "Pro",
    price: "RS 600",
    period: "per month",
    highlight: true,
    badge: "Most popular",
    limit: "Unlimited meetings",
    perks: [
      "Everything in Free",
      "Unlimited meeting uploads",
      "Priority processing",
    ],
    cta: "Upgrade to Pro",
    note: "Unlimited AI meeting analysis",
  },
];

const OUTPUT_PREVIEWS = [
  {
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b09070"
        strokeWidth="1.6"
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
    desc: "Every word, speaker-labelled.",
  },
  {
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b09070"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    label: "Action items",
    desc: "Tasks with owners, ready to copy.",
  },
  {
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b09070"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    label: "Key decisions",
    desc: "What was agreed and why.",
  },
  {
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b09070"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "Summary",
    desc: "3-sentence TL;DR.",
  },
];

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const uploadRef = useRef(null);
  const { user } = useAuth();

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#2c2c2c] font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }

        .organic-border {
          border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
          border: 1px solid #e2dfd8;
        }

        .human-underline { position: relative; white-space: nowrap; }
        .human-underline::after {
          content: '';
          position: absolute;
          bottom: 2px; left: -2%;
          width: 104%; height: 8px;
          background-color: rgba(200, 169, 126, 0.3);
          transform: rotate(-1.5deg);
          z-index: -1; border-radius: 3px;
        }

        @keyframes subtleUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
        .anim-up { animation: subtleUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }

        .cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1a1a1a; color: #faf8f4;
          font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 500;
          padding: 14px 28px; border-radius: 14px; border: none;
          cursor: pointer; transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
        }
        .cta-btn:hover { background: #2e2e2e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,26,26,0.16); }
        .cta-btn:active { transform: translateY(0); }

        .cta-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: #8a7560;
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 400;
          padding: 0; border: none; cursor: pointer;
          transition: color 0.2s; text-decoration: none;
        }
        .cta-ghost:hover { color: #c8a97e; }

        .plan-card {
          background: #ffffff; border: 1px solid #ede9e2; border-radius: 20px;
          padding: 28px 24px 24px; display: flex; flex-direction: column; gap: 20px;
          transition: box-shadow 0.2s, transform 0.2s; position: relative;
        }
        .plan-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .plan-card.featured { border: 1.5px solid #c8a97e; background: #fffdf9; }
        .plan-badge {
          display: inline-block; background: #f4ece0; color: #8a6a3d;
          font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
          padding: 3px 10px; border-radius: 20px; margin-bottom: -6px;
        }
        .plan-perk { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: #555; line-height: 1.5; }
        .plan-perk-dot { flex-shrink: 0; width: 5px; height: 5px; border-radius: 50%; background: #c8a97e; margin-top: 7px; }
        .plan-cta {
          width: 100%; padding: 11px 0; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
          cursor: pointer; border: 1.5px solid #1a1a1a;
          background: transparent; color: #1a1a1a;
          transition: background 0.18s, color 0.18s; margin-top: auto;
        }
        .plan-cta:hover { background: #1a1a1a; color: #faf8f4; }
        .plan-cta.featured { background: #1a1a1a; color: #faf8f4; border-color: #1a1a1a; }
        .plan-cta.featured:hover { background: #2e2e2e; }

        /* ── Upload section ── */
        .upload-section { background: #f7f4ef; border-top: 1px solid #ede9e2; border-bottom: 1px solid #ede9e2; }

        .output-preview-chip {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 14px;
          background: #fff; border: 1px solid #ede9e2;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .output-preview-chip:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.05); transform: translateY(-1px); }

        .trust-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; color: #999;
        }

        .free-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fef9f0; border: 1px solid #f0ddb5;
          color: #8a6a3d; font-size: 12px; font-weight: 500;
          padding: 5px 12px; border-radius: 20px;
        }
        .free-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #c8a97e; }

        @keyframes processingPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .processing-pulse { animation: processingPulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* ── Hero ── */}
      <section className="max-w-[1100px] mx-auto px-6 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-16 lg:gap-24 items-center">
          <div className="flex flex-col items-start text-left anim-up delay-1">
            <h1 className="font-playfair text-[clamp(42px,5.5vw,68px)] leading-[1.05] tracking-tight text-[#111] mb-6">
              Meetings that <br />
              actually{" "}
              <span className="human-underline italic">make sense.</span>
            </h1>
            <p className="text-[17px] font-light text-[#555] leading-relaxed max-w-[440px] mb-10">
              Skip the manual note-taking. Upload your recording and we'll hand
              you back the transcription, decisions, and action items in under a
              minute.
            </p>
            <div className="flex items-center gap-5 flex-wrap mb-10">
              <button className="cta-btn" onClick={scrollToUpload}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload a recording
              </button>
              <button
                className="cta-ghost"
                onClick={() =>
                  document
                    .getElementById("pricing")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See pricing
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-[13px] text-[#888]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#c8a97e] text-xs">✦</span> No account
                required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#c8a97e] text-xs">✦</span> First 5 min
                free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#c8a97e] text-xs">✦</span> Fast
                turnaround
              </span>
            </div>
          </div>

          <div className="anim-up delay-2 w-full flex justify-center lg:justify-end relative">
            <div className="relative isolate">
              <div className="absolute -inset-4 organic-border -z-10 bg-[#faf8f4]"></div>
              <AudioToMinutesCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white border-y border-[#f0ede6]">
        <div className="max-w-[1100px] mx-auto px-6 py-24 anim-up delay-3">
          <div className="flex flex-col md:flex-row gap-16 md:gap-10 justify-between">
            {features.map((f, i) => (
              <div key={i} className="flex-1 max-w-[320px]">
                <div className="text-[#c8a97e] font-playfair text-2xl mb-4 italic">
                  {f.num}—
                </div>
                <h3 className="font-playfair text-2xl font-medium tracking-tight text-[#1a1a1a] mb-3">
                  {f.title}
                </h3>
                <p className="text-[15px] font-light text-[#6a6a6a] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upload Section (richer two-column layout) ── */}
      <section ref={uploadRef} className="upload-section">
        <div className="max-w-[1100px] mx-auto px-6 py-20">
          {/* Section heading — centred, compact */}
          <div className="text-center mb-12">
            <span className="text-[11.5px] font-medium text-[#c8a97e] uppercase tracking-widest">
              Try it now
            </span>
            <h2 className="font-playfair text-[clamp(26px,3.5vw,38px)] tracking-tight text-[#111] mt-2 mb-3">
              Ready to get started?
            </h2>
            <p className="text-[15px] font-light text-[#777] max-w-[360px] mx-auto leading-relaxed">
              Drop in your recording. Get your notes. Free for first 3 meetings
            </p>
          </div>

          {/* Two-column: form left, output preview right */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-8 lg:gap-12 items-start">
            {/* Left — the form */}
            <div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #ede9e2",
                  borderRadius: "24px",
                  padding: "28px",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                        margin: 0,
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      Upload your recording
                    </p>
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#aaa",
                        margin: "3px 0 0",
                        fontWeight: 300,
                      }}
                    >
                      MP3 or WAV · up to 500 MB
                    </p>
                  </div>
                  <div className="free-pill">
                    <div className="free-pill-dot" />
                    Free up to first 3 meets
                  </div>
                </div>

                <UploadForm
                  setProcessing={setProcessing}
                  isAuthenticated={!!localStorage.getItem("im_token")}
                />

                {processing && (
                  <div
                    className="mt-4 flex items-center gap-2.5 text-[12.5px] text-[#8a7560]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-[#c8a97e]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="processing-pulse">
                      Reading through your meeting…
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-[12px] text-[#bbb] mt-4">
                Need unlimited meeting analysis?{" "}
                <button
                  className="text-[#c8a97e] font-medium underline-offset-2 hover:underline bg-transparent border-none cursor-pointer"
                  onClick={() =>
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  See our plans below.
                </button>
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#bbb",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "12px",
                  }}
                >
                  What you'll receive
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {OUTPUT_PREVIEWS.map((o, i) => (
                    <div key={i} className="output-preview-chip">
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          flexShrink: 0,
                          borderRadius: "8px",
                          background: "#f4f0e8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {o.icon}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#2c2c2c",
                            margin: 0,
                          }}
                        >
                          {o.label}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#aaa",
                            margin: "2px 0 0",
                            lineHeight: 1.4,
                          }}
                        >
                          {o.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#f0ede6" }} />

              {/* Nudge to demo page */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #ede9e2",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    flexShrink: 0,
                    borderRadius: "10px",
                    background: "#f4f0e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#b09070"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      margin: 0,
                    }}
                  >
                    Want to see a full walkthrough?
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      margin: "3px 0 6px",
                      lineHeight: 1.5,
                    }}
                  >
                    Try our interactive demo with a sample recording.
                  </p>
                  <a
                    href="/demo"
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#8a6a3d",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Open demo page →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#fcfbf9]">
        <div className="max-w-[1100px] mx-auto px-6 py-24">
          <div className="text-center mb-14 anim-up delay-3">
            <h2 className="font-playfair text-[clamp(30px,4vw,46px)] tracking-tight text-[#111] mb-4">
              Simple, honest pricing.
            </h2>
            <p className="text-[16px] font-light text-[#777] max-w-[420px] mx-auto leading-relaxed">
              Start free. Upgrade only when you need more. No hidden fees, no
              annual lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 anim-up delay-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`plan-card${plan.highlight ? " featured" : ""}`}
              >
                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                <div>
                  <p className="text-[13px] font-medium text-[#999] uppercase tracking-widest mb-1">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-playfair text-[40px] text-[#111] leading-none">
                      {plan.price}
                    </span>
                    <span className="text-[13px] text-[#aaa]">
                      {plan.period}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#8a7560] bg-[#faf6f0] px-3 py-1 rounded-full border border-[#f0ddb5]">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {plan.limit}
                  </div>
                </div>
                <div className="h-px bg-[#f0ede6]" />
                <div className="flex flex-col gap-3">
                  {plan.perks.map((perk, i) => (
                    <div key={i} className="plan-perk">
                      <div className="plan-perk-dot" />
                      {perk}
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <button
                    className={`plan-cta${plan.highlight ? " featured" : ""}`}
                    onClick={() => {
                      console.log("Clicked:", plan.name);

                      if (plan.name === "Pro") {
                        console.log("Opening modal");
                        setShowSubscriptionModal(true);
                      }
                    }}
                  >
                    {plan.cta}
                  </button>
                  {plan.note && (
                    <p className="text-center text-[11.5px] text-[#bbb]">
                      {plan.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {showSubscriptionModal && (
              <SubscriptionModal
                onClose={() => setShowSubscriptionModal(false)}
                isSubscribed={user?.subscribed}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#f0ede6] max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[#999] text-[13px]">
        <p>© {new Date().getFullYear()} IntelliMinute.</p>
        <p>Because you have better things to do than formatting notes.</p>
      </footer>
    </div>
  );
}
