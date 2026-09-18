import { getInitials } from "@/components/discover/RideCard";
import { cn } from "@/lib/utils";

interface JoinRequestRowProps {
  riderName: string;
  rideTitle: string;
  attendancePct?: number | null;
  canApprove?: boolean;
  blockedMessage?: string;
  onApprove: () => void;
  onDecline: () => void;
}

const JoinRequestRow = ({
  riderName,
  rideTitle,
  attendancePct,
  canApprove = true,
  blockedMessage,
  onApprove,
  onDecline,
}: JoinRequestRowProps) => (
  <div className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A1608] text-sm font-bold text-[#FF9D4D]">
      {getInitials(riderName)}
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="truncate text-sm font-bold leading-tight text-[#F0F0F0]">{riderName}</span>
      <span className="truncate text-[11px] text-[#666666]">Wants to join "{rideTitle}"</span>
      {attendancePct != null && (
        <span className="text-[11px] text-[#888888]">{attendancePct}% attendance</span>
      )}
      {blockedMessage && <span className="text-[11px] text-[#FF6600]">{blockedMessage}</span>}
    </div>
    <div className="flex shrink-0 flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={onApprove}
        disabled={!canApprove}
        className={cn(
          "rounded-xl border px-3 py-1.5 text-xs font-bold transition-transform active:scale-95",
          canApprove
            ? "border-[#16A34A] text-[#16A34A]"
            : "cursor-not-allowed border-[#333333] text-[#555555]"
        )}
      >
        Approve
      </button>
      <button
        type="button"
        onClick={onDecline}
        className="rounded-xl border border-[#555555] px-3 py-1.5 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-95"
      >
        Decline
      </button>
    </div>
  </div>
);

export default JoinRequestRow;
