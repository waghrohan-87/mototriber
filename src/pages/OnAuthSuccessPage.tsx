import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const OnAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#111111] px-6 text-center text-[#F0F0F0]">
      <h1 className="text-xl font-bold text-[#F0F0F0]">Registration Verified Successfully!</h1>
      <p className="text-xs text-[#666666]">Redirecting to login in {countdown}s...</p>
    </div>
  );
};

export default OnAuthSuccessPage;
