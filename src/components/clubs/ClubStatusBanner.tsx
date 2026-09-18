import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useClubs } from "@/context/ClubsContext";
import { SUPPORT_HANDLE } from "@/components/club-registration/clubApplicationTypes";

const DISMISSED_KEY = "mototriber:dismissed-club-notifications";

const readDismissed = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const ClubStatusBanner = () => {
  const navigate = useNavigate();
  const { myApplication } = useClubs();
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  if (!myApplication) return null;

  const key = `${myApplication.id}:${myApplication.status}`;
  if (myApplication.status !== "pending" && dismissed.has(key)) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(key);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // Ignore storage errors (e.g. private browsing).
    }
  };

  if (myApplication.status === "pending") {
    return (
      <div className="flex items-start gap-3 border-b border-[#333333] bg-[#1A1608] px-4 py-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB020]" />
        <p className="text-xs leading-relaxed text-[#F0F0F0]">
          Your club application is under review. We'll notify you within 48 hours.
        </p>
      </div>
    );
  }

  if (myApplication.status === "approved") {
    return (
      <div className="flex items-start gap-3 border-b border-[#333333] bg-[#0F2A17] px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-xs leading-relaxed text-[#F0F0F0]">
            Your club <span className="font-bold">{myApplication.club_name}</span> has been approved and is now
            live on MotoTriber.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/club/app-${myApplication.id}/admin`)}
            className="self-start text-xs font-bold text-[#16A34A] underline-offset-2 active:underline"
          >
            Manage your club
          </button>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss notification" className="shrink-0 text-[#888888]">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 border-b border-[#333333] bg-[#2A1212] px-4 py-3">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-xs leading-relaxed text-[#F0F0F0]">
          Your club application was not approved. Contact us at {SUPPORT_HANDLE} for more information.
        </p>
        <button
          type="button"
          onClick={() => navigate("/register-club")}
          className="self-start text-xs font-bold text-[#DC2626] underline-offset-2 active:underline"
        >
          Re-submit application
        </button>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss notification" className="shrink-0 text-[#888888]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ClubStatusBanner;
