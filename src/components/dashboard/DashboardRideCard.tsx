import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardPinAlert = { type: "edit" | "cancel" } | null;

interface DashboardRideCardProps {
  title: string;
  rideDate: string;
  creatorName: string;
  pinAlert?: DashboardPinAlert;
  onOpen: () => void;
  onDropOut: () => void;
}

const DashboardRideCard = ({
  title,
  rideDate,
  creatorName,
  pinAlert,
  onOpen,
  onDropOut,
}: DashboardRideCardProps) => {
  const isCancelled = pinAlert?.type === "cancel";
  const isEdited = pinAlert?.type === "edit";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5 transition-opacity",
        isCancelled && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <span className="flex items-center gap-1.5">
            {pinAlert && (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", isCancelled ? "bg-[#DC2626]" : "bg-[#F97316]")}
              />
            )}
            <h3 className="truncate text-sm font-bold leading-tight text-[#F0F0F0]">{title}</h3>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#888888]">
            <Calendar className="h-3.5 w-3.5" />
            {rideDate}
          </span>
          <span className="truncate text-xs text-[#AAAAAA]">
            By <span className="font-semibold text-[#F0F0F0]">{creatorName}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDropOut();
          }}
          className="shrink-0 text-xs font-semibold text-[#888888] transition-colors active:text-[#DC2626]"
        >
          {isCancelled ? "Remove from list" : "Drop out"}
        </button>
      </div>

      {(isCancelled || isEdited) && (
        <button type="button" onClick={onOpen} className="text-left text-xs font-semibold">
          {isCancelled ? (
            <span className="text-[#F87171]">✕ This ride has been cancelled</span>
          ) : (
            <span className="text-[#FB923C]">⚠ Ride details updated — tap to see changes</span>
          )}
        </button>
      )}
    </div>
  );
};

export default DashboardRideCard;
