import { useState } from "react";
import { activateSubscription } from "../services/api.js";

export default function SubscriptionModal({ onClose, isSubscribed = false }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    // Already subscribed safeguard
    if (isSubscribed) {
      alert("You already have an active Pro subscription.");
      return;
    }

    setLoading(true);

    try {
      // Fake payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Activate subscription in backend
      await activateSubscription("pro");

      setSuccess(true);

      setTimeout(() => {
        onClose();

        // Refresh app state
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("SUBSCRIPTION ERROR:", err);

      const message =
        err?.response?.data?.error || "Subscription failed. Please try again.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-3xl bg-white p-8 shadow-2xl"
      >
        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✓</div>

            <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
              Subscription Activated
            </h2>

            <p className="text-sm text-[#777]">Redirecting...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎙</div>

              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-3">
                Upgrade to Pro
              </h2>

              <p className="text-sm leading-relaxed text-[#666]">
                Unlock unlimited AI-powered meeting analysis, transcription,
                summaries, and action items.
              </p>
            </div>

            {/* Already subscribed notice */}
            {isSubscribed && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Your account already has an active Pro subscription.
              </div>
            )}

            {/* Plans */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Free */}
              <div className="rounded-2xl border border-[#e5e5e5] p-5">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-1">
                  Free
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#111]">Rs 0</span>
                </div>

                <ul className="space-y-2 text-xs text-[#666] list-disc pl-4">
                  <li>3 meeting summaries</li>
                  <li>Full transcription</li>
                  <li>Action items</li>
                  <li>PDF export</li>
                </ul>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl border-2 border-[#1a1a1a] bg-[#fafafa] p-5">
                <div className="absolute -top-2 left-4 rounded-full bg-[#1a1a1a] px-2 py-1 text-[10px] uppercase tracking-wide text-white">
                  Most popular
                </div>

                <p className="text-sm font-semibold text-[#1a1a1a] mb-1 mt-2">
                  Pro
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#111]">Rs 600</span>

                  <span className="ml-1 text-xs text-[#999]">/month</span>
                </div>

                <ul className="space-y-2 text-xs text-[#666] list-disc pl-4">
                  <li>Unlimited meetings</li>
                  <li>Priority processing</li>
                  <li>Meeting history</li>
                  <li>Advanced AI summaries</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={loading || isSubscribed}
              className={`w-full rounded-2xl py-3 text-sm font-medium transition mb-3 ${
                loading || isSubscribed
                  ? "bg-[#d6d6d6] text-[#666] cursor-not-allowed"
                  : "bg-[#1a1a1a] text-white hover:bg-[#2e2e2e]"
              }`}
            >
              {isSubscribed
                ? "Already Subscribed"
                : loading
                  ? "Processing Payment..."
                  : "Subscribe for Rs 600/month"}
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full text-sm text-[#999] hover:text-[#555] transition"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
