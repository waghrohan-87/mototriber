import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const errorTextClass = "text-xs text-[#EF4444]";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (confirmPassword !== password) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setError("This reset link is invalid or has expired.");
        return;
      }
      const { error: resetError } = await window.ezsite.apis.resetPassword({ token, password });
      if (resetError) {
        setError(resetError);
        return;
      }
      navigate("/login", { state: { toastMessage: "Password updated. Please sign in." } });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] px-6 text-[#F0F0F0]">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-bold text-[#F0F0F0]">Set a new password</h1>
          <p className="text-sm text-[#888888]">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a new password"
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Confirm new password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={fieldClass}
            />
          </div>

          {error && <p className={errorTextClass}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
