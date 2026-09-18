import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { clearPendingRideInvite, getPendingRideInviteId, notifyPendingRideInvite } from "@/lib/rideInvite";

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const errorTextClass = "text-xs text-[#EF4444]";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const toastMessage = (location.state as { toastMessage?: string } | null)?.toastMessage;
    if (toastMessage) {
      toast({ title: toastMessage });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: loginError } = await window.ezsite.apis.login({ email, password });
      if (loginError) {
        setError("Incorrect email or password. Please try again.");
        setPassword("");
        return;
      }

      const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError || !userInfo) {
        navigate("/");
        return;
      }

      await notifyPendingRideInvite(userInfo.ID);

      const { data: profiles, error: profileError } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: userInfo.ID }],
      });
      if (profileError) throw new Error(profileError);

      const profile = profiles?.List?.[0];
      if (!profile) {
        navigate("/profile-setup");
        return;
      }

      await window.ezsite.apis.tableUpdate("user_profiles", {
        ID: profile.ID,
        last_login: new Date().toISOString(),
      });

      const pendingRideId = getPendingRideInviteId();
      if (pendingRideId) {
        navigate(`/ride/${pendingRideId}`, { replace: true });
        clearPendingRideInvite();
      } else {
        navigate("/");
      }
    } catch {
      setError("Incorrect email or password. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-xl font-bold text-[#F0F0F0]">Welcome back</h1>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#F0F0F0]">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F0F0F0]">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#FF6600]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            {error && <p className={errorTextClass}>{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-[#888888]">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-[#FF6600]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
