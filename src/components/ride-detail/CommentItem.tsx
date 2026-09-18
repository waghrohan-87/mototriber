import { cn } from "@/lib/utils";
import { tintForName } from "@/lib/avatarTint";
import { getInitials } from "@/components/discover/RideCard";

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface CommentItemProps {
  userName: string;
  text: string;
  createdAt: string;
  isPinned: boolean;
  pinType: "edit" | "cancel" | "claim" | "dropout" | null;
}

const PIN_TYPE_LABEL: Record<"edit" | "cancel" | "claim" | "dropout", string> = {
  edit: "Edited",
  cancel: "Cancelled",
  claim: "Claimed",
  dropout: "Dropped out",
};

const CommentItem = ({ userName, text, createdAt, isPinned, pinType }: CommentItemProps) => {
  const tint = tintForName(userName);

  if (isPinned) {
    const isCancelled = pinType === "cancel";
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-[#FF6600]/30 bg-[#2A1608]/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#FF9D4D]">📌 Pinned update</span>
          {pinType && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isCancelled ? "bg-[#DC2626]/20 text-[#F87171]" : "bg-[#FF6600]/20 text-[#FF9D4D]"
              )}
            >
              {PIN_TYPE_LABEL[pinType]}
            </span>
          )}
        </div>
        <div className="flex items-start gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: tint.background, color: tint.color }}
          >
            {getInitials(userName)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-bold text-[#F0F0F0]">{userName}</span>
            <p className="text-sm leading-relaxed text-[#DDDDDD]">{text}</p>
            <span className="text-[10px] text-[#888888]">{formatTimestamp(createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: tint.background, color: tint.color }}
      >
        {getInitials(userName)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-[#F0F0F0]">{userName}</span>
          <span className="text-[10px] text-[#888888]">{formatTimestamp(createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed text-[#DDDDDD]">{text}</p>
      </div>
    </div>
  );
};

export default CommentItem;
