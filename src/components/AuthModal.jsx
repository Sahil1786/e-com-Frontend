import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { api } from "../api";

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function sendCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/send-otp", {
        method: "POST",
        body: { mobile: form.mobile, purpose: mode === "register" ? "Register" : "Login" },
      });
      setOtpSent(true);
      setDevOtp(result.devOtp || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/verify-otp";
      const body = mode === "register"
        ? { name: form.name, email: form.email || undefined, mobile: form.mobile, otp: form.otp }
        : { mobile: form.mobile, otp: form.otp };
      const result = await api(endpoint, { method: "POST", body });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setOtpSent(false);
    setDevOtp("");
    setError("");
    setForm((current) => ({ ...current, otp: "" }));
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card max-w-[440px]" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close sign in">
          <X size={19} />
        </button>
        <div className="mb-7">
          <span className="eyebrow">YOUR NAJU’S MAGIC SHOP ACCOUNT</span>
          <h2 id="auth-title" className="mt-3 font-display text-3xl font-semibold tracking-[-.05em] text-ink">
            {mode === "login" ? "Welcome back." : "Step into the strange."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sign in with a one-time code to keep your bag and orders together.
          </p>
        </div>
        {mode === "register" && !otpSent && (
          <>
            <label className="form-label">Your name</label>
            <input className="form-input mb-4" name="name" value={form.name} onChange={update} autoComplete="name" required placeholder="Name" />
            <label className="form-label">Email <span className="font-normal text-muted">(optional)</span></label>
            <input className="form-input mb-4" name="email" type="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@example.com" />
          </>
        )}
        {!otpSent ? (
          <form onSubmit={sendCode}>
            <label className="form-label">Mobile number</label>
            <div className="flex">
              <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-line bg-canvas px-4 text-sm text-muted">+91</span>
              <input
                className="form-input rounded-l-none"
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={form.mobile}
                onChange={update}
                placeholder="10-digit number"
                pattern="[6-9][0-9]{9}"
                required
              />
            </div>
            <button type="submit" className="button-primary mt-5 w-full" disabled={busy}>
              {busy ? "Sending code..." : "Send sign-in code"} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <div className="mb-5 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
              <span className="text-sm text-ink">Code sent to +91 {form.mobile}</span>
              <button type="button" className="text-xs font-semibold text-leaf" onClick={() => setOtpSent(false)}>Edit</button>
            </div>
            <label className="form-label">One-time code</label>
            <input
              className="form-input text-center text-lg tracking-[.5em]"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={form.otp}
              onChange={(event) => setForm((current) => ({
                ...current,
                otp: event.target.value.replace(/\D/g, "").slice(0, 6),
              }))}
              placeholder="••••••"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              autoFocus
            />
            {devOtp && (
              <button type="button" className="mt-3 flex w-full items-center justify-between rounded-xl border border-leaf/15 bg-emerald-50 px-4 py-3 text-left" onClick={() => setForm((current) => ({ ...current, otp: devOtp }))}>
                <span className="text-xs text-leaf">Local development code <strong className="ml-1 tracking-widest">{devOtp}</strong></span>
                <Check size={15} className="text-leaf" />
              </button>
            )}
            <button type="submit" className="button-primary mt-5 w-full" disabled={busy}>
              {busy ? "Verifying..." : mode === "register" ? "Create account" : "Verify & sign in"} <ArrowRight size={16} />
            </button>
            <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-semibold text-muted hover:text-ink" onClick={() => { setOtpSent(false); setForm((current) => ({ ...current, otp: "" })); }}>
              <ArrowLeft size={14} /> Send a new code
            </button>
          </form>
        )}
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
        <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          {mode === "login" ? "New around here?" : "Already have an account?"}{" "}
          <button type="button" className="font-semibold text-leaf hover:underline" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </section>
    </div>
  );
}
