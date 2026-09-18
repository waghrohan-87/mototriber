import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatedRideCardProps {
  title: string;
  rideDate: string;
  status: string;
  joinedCount: number;
  maxRiders: number;
  onOpen: () => void;
}

type DisplayStatus = "live" | "planned" | "cancelled" | "pending_confirmation" | "complete" | "expired";

const STATUS_STYLES: Record<DisplayStatus, { bg: string; color: string; label: string }> = {
  live: { bg: "rgba(34,197,94,0.15)", color: "#22C55E", label: "Live" },
  planned: { bg: "rgba(255,102,0,0.15)", color: "#FF6600", label: "Planned" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#EF4444", label: "Cancelled" },
  pending_confirmation: { bg: "rgba(255,102,0,0.15)", color: "#FF6600", label: "Confirm attendance" },
  complete: { bg: "rgba(136,136,136,0.15)", color: "#888888", label: "Complete" },
  expired: { bg: "rgba(136,136,136,0.15)", color: "#888888", label: "Expired" },
};

const getDisplayStatus = (status: string, joinedCount: number): DisplayStatus => {
  if (status === "cancelled") return "cancelled";
  if (status === "pending_confirmation") return "pending_confirmation";
  if (status === "complete") return "complete";
  if (status === "expired") return "expired";
  return joinedCount > 0 ? "live" : "planned";
};

const CreatedRideCard = ({ title, rideDate, status, joinedCount, maxRiders, onOpen }: CreatedRideCardProps) => {
  const displayStatus = getDisplayStatus(status, joinedCount);
  const statusStyle = STATUS_STYLES[displayStatus];
  const isCancelled = displayStatus === "cancelled";
  const pct = maxRiders > 0 ? Math.min(100, (joinedCount / maxRiders) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex flex-col gap-2.5 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5 text-left transition-colors active:border-[#FF6600]/50",
        isCancelled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold leading-tight text-[#F0F0F0]">{title}</h3>
        <span
          className="shrink-0 rounded-[20px] px-2.5 py-[3px] text-[11px] font-semibold"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      <span className="flex items-center gap-1.5 text-xs text-[#888888]">
        <Calendar className="h-3.5 w-3.5" />
        {rideDate}
      </span>

      {!isCancelled && maxRiders > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
            <div className="h-full rounded-full bg-[#FF6600] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-[#888888]">
            {joinedCount}/{maxRiders} spots filled
          </span>
        </div>
      )}
    </button>
  );
};

export default CreatedRideCard;
