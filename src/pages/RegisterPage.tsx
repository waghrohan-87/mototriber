import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const errorTextClass = "text-xs text-[#EF4444]";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_DELAY_SECONDS = 60;

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_DELAY_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!submitted || resendSecondsLeft === 0) return;
    const timer = setTimeout(() => setResendSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitted, resendSecondsLeft]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = "Please enter your full name";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match";
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const { error: registerError } = await window.ezsite.apis.register({ email: email.trim(), password });
      if (registerError) {
        setErrors({ email: registerError });
        return;
      }
      sessionStorage.setItem("pending_full_name", fullName.trim());
      setSubmitted(true);
    } catch {
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error: resendError } = await window.ezsite.apis.register({ email: email.trim(), password });
      if (resendError) throw new Error(resendError);
      toast({ title: "Verification email resent" });
      setResendSecondsLeft(RESEND_DELAY_SECONDS);
    } catch (err) {
      toast({
        title: "Couldn't resend email",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] px-6 text-center text-[#F0F0F0]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6600]/15 text-[#FF6600]">
          <Mail className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold text-[#F0F0F0]">Check your email</h1>
        <p className="max-w-xs text-sm text-[#888888]">
          We sent a verification link to <span className="text-[#F0F0F0]">{email}</span>. Click it to activate your
          account.
        </p>
        <p className="text-xs text-[#666666]">The link expires in 24 hours.</p>

        <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
          <a
            href="mailto:"
            className="w-full rounded-xl border border-[#555555] py-3 text-sm font-bold text-[#AAAAAA] transition-colors active:bg-[#1a1a1a]"
          >
            Open email app
          </a>
          {resendSecondsLeft === 0 && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-xl border border-[#FF6600] py-3 text-sm font-bold text-[#FF6600] transition-colors active:bg-[#FF6600]/10 disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend email"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] px-6 text-[#F0F0F0]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <span
            style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: "32px" }}
            className="leading-none tracking-wide"
          >
            <span className="text-white">MOTO</span>
            <span className="text-[#FF6600]">TRIBER</span>
          </span>
          <span
            style={{ fontFamily: "system-ui, sans-serif", fontSize: "12px", fontWeight: 400 }}
            className="leading-none text-[#888888]"
          >
            Find your tribe. Find your ride.
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#F0F0F0]">Create your account</h1>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className={fieldClass}
            />
            {errors.fullName && <p className={errorTextClass}>{errors.fullName}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldClass}
            />
            {errors.email && <p className={errorTextClass}>{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] transition-colors active:text-[#F0F0F0]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className={errorTextClass}>{errors.password}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] transition-colors active:text-[#F0F0F0]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={errorTextClass}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-xs text-[#888888]">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#FF6600]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
