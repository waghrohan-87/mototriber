import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const errorTextClass = "text-xs text-[#EF4444]";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: sendError } = await window.ezsite.apis.sendResetPwdEmail({ email: email.trim() });
      if (sendError) {
        setError(sendError);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] px-6 text-[#F0F0F0]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex w-full items-center">
          <Link
            to="/login"
            aria-label="Back to sign in"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold text-[#F0F0F0]">Check your email</h1>
            <p className="max-w-xs text-sm text-[#888888]">Check your email for a reset link.</p>
            <Link to="/login" className="mt-2 text-xs font-bold text-[#FF6600]">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-xl font-bold text-[#F0F0F0]">Reset your password</h1>
              <p className="text-sm text-[#888888]">We'll email you a link to reset it</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#F0F0F0]">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email address"
                  className={fieldClass}
                />
                {error && <p className={errorTextClass}>{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
