import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/authContext";

/* ── Reusable Input (same as old navbar) ── */
function Input({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[#555] font-dm-sans">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full px-4 py-2.5 rounded-xl text-[13.5px]
          bg-[#f7f4ef] border border-black/10 text-[#1a1a1a]
          outline-none placeholder:text-[#bbb]
          focus:bg-white focus:border-[#c8a97e]/60
          focus:shadow-[0_0_0_3px_rgba(200,169,126,0.12)]
          transition-all
        "
      />
    </div>
  );
}

/* ── Modal Shell (reused) ── */
function Modal({ open, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      onClick={(e) => e.target === ref.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,14,12,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div className="anim-modal-in w-full max-w-[420px] bg-[#faf8f4] rounded-3xl shadow-[0_24px_80px_rgba(26,26,26,0.18)] border border-black/[0.07] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ── Main Auth Modal ── */
export function AuthModal({ open, onClose }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setMode("login");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Logged in successfully");
      } else {
        await register(name, email, password);
        toast.success("Account created successfully");
      }
      handleClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-black/[0.06]">
        <div>
          <h2 className="font-serif-display text-[22px] text-[#0f0e0c]">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[12.5px] text-[#999] font-dm-sans">
            {mode === "login"
              ? "Sign in to your account"
              : "Start your journey"}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center hover:bg-black/10"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-7 pt-5 gap-2">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2 rounded-xl text-sm ${
            mode === "login" ? "bg-black text-white" : "bg-black/5 text-[#555]"
          }`}
        >
          Login
        </button>

        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-2 rounded-xl text-sm ${
            mode === "register"
              ? "bg-black text-white"
              : "bg-black/5 text-[#555]"
          }`}
        >
          Signup
        </button>
      </div>

      {/* Form */}
      <div className="px-7 py-6 flex flex-col gap-4">
        {mode === "register" && (
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            w-full bg-[#1a1a1a] text-white py-3 rounded-xl
            hover:bg-[#2e2e2e] transition-all
            disabled:opacity-50
          "
        >
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </div>

      {/* Footer */}
      <div className="px-7 pb-6 text-center text-sm text-[#aaa]">
        {mode === "login" ? (
          <>
            Don’t have an account?{" "}
            <button
              onClick={() => setMode("register")}
              className="text-[#c8a97e]"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("login")} className="text-[#c8a97e]">
              Sign in
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
