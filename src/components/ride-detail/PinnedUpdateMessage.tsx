import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { tintForName } from "@/lib/avatarTint";
import { getInitials, RideUpdate } from "@/components/discover/RideCard";

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface PinnedUpdateMessageProps {
  update: RideUpdate;
}

const PinnedUpdateMessage = ({ update }: PinnedUpdateMessageProps) => {
  const tint = tintForName(update.authorName);
  const isCancelled = update.type === "cancelled";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#FF6600]/30 bg-[#2A1608]/40 p-4">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#FF9D4D]">
        <Pin className="h-3 w-3" />
        Pinned update
      </span>

      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: tint.background, color: tint.color }}
        >
          {getInitials(update.authorName)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#F0F0F0]">{update.authorName} updated this ride</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isCancelled ? "bg-[#DC2626]/20 text-[#F87171]" : "bg-[#FF6600]/20 text-[#FF9D4D]"
              )}
            >
              {isCancelled ? "Cancelled" : "Edited"}
            </span>
          </div>
          <p className="text-sm text-[#DDDDDD]">{update.reason}</p>
          <span className="text-[10px] text-[#888888]">{formatTimestamp(update.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default PinnedUpdateMessage;
