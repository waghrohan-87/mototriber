import { cn } from "@/lib/utils";
import { getInitials } from "@/components/discover/RideCard";
import BikeTagPill from "@/components/shared/BikeTagPill";
import AttendanceBadge from "@/components/shared/AttendanceBadge";
import AttendanceInterestsRow from "@/components/shared/AttendanceInterestsRow";
import { Rider } from "@/components/riders/RiderCard";

const TINT_STYLES: Record<string, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

interface JoinRequestCardProps {
  rider: Rider;
  onApprove: () => void;
  onDecline: () => void;
}

const JoinRequestCard = ({ rider, onApprove, onDecline }: JoinRequestCardProps) => (
  <div className="flex flex-col gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5">
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          TINT_STYLES[rider.avatarTint]
        )}
      >
        {getInitials(rider.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold leading-tight text-[#F0F0F0]">{rider.name}</h3>
          <AttendanceBadge attendanceRate={rider.attendanceRate} confirmedRides={rider.totalRides} className="shrink-0" />
        </div>
        <p className="truncate text-xs leading-tight text-[#888888]">{rider.handle}</p>
        <BikeTagPill label={rider.bikes[0]} />
        <AttendanceInterestsRow
          attendanceRate={rider.attendanceRate}
          confirmedRides={rider.totalRides}
          interests={rider.ridingInterests}
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onApprove}
        className="flex-1 rounded-xl border border-[#16A34A] py-2.5 text-xs font-bold text-[#16A34A] transition-transform active:scale-[0.98]"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={onDecline}
        className="flex-1 rounded-xl border border-[#555555] py-2.5 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-[0.98]"
      >
        Decline
      </button>
    </div>
  </div>
);

export default JoinRequestCard;
