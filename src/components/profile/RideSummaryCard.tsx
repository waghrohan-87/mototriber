import { Calendar, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export type RideVisibility = "public" | "club" | "private";

export interface RideSummary {
  id: string;
  title: string;
  date: string;
  distance: string;
  visibility: RideVisibility;
}

const VISIBILITY_LABEL: Record<RideVisibility, string> = {
  public: "Public",
  club: "Club",
  private: "Private",
};

const VISIBILITY_STYLES: Record<RideVisibility, string> = {
  public: "bg-[#FF6600]/15 text-[#FF9D4D] border border-[#FF6600]/40",
  club: "bg-[#1E3A8A]/30 text-[#60A5FA] border border-[#3B82F6]/40",
  private: "bg-[#2A2A2A] text-[#AAAAAA] border border-[#3A3A3A]",
};

const RideSummaryCard = ({ ride }: { ride: RideSummary }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#333333] bg-[#1a1a1a] p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="truncate text-sm font-bold text-[#F0F0F0]">{ride.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#888888]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {ride.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            {ride.distance}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
          VISIBILITY_STYLES[ride.visibility]
        )}
      >
        {VISIBILITY_LABEL[ride.visibility]}
      </span>
    </div>
  );
};

export default RideSummaryCard;
