import { cn } from "@/lib/utils";
import { getInitials } from "@/components/discover/RideCard";
import AttendanceBadge from "@/components/shared/AttendanceBadge";
import AttendanceDot from "@/components/shared/AttendanceDot";
import BadgePill from "@/components/shared/BadgePill";
import { Rider } from "@/components/riders/RiderCard";
import { OrganiserBadgeTier } from "@/lib/reputation";

const TINT_STYLES: Record<string, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

interface OrganiserCardProps {
  rider: Rider;
  badge: OrganiserBadgeTier;
  isCaptain: boolean;
  invitePending: boolean;
  onInvite: () => void;
}

const OrganiserCard = ({ rider, badge, isCaptain, invitePending, onInvite }: OrganiserCardProps) => (
  <div className="flex flex-col gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5">
    <div className="flex items-start gap-3">
      <span className="relative shrink-0">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
            TINT_STYLES[rider.avatarTint]
          )}
        >
          {getInitials(rider.name)}
        </span>
        <AttendanceDot attendanceRate={rider.attendanceRate} confirmedRides={rider.totalRides} ringColor="#1a1a1a" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="min-w-0 truncate text-sm font-bold leading-tight text-[#F0F0F0]">{rider.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <AttendanceBadge attendanceRate={rider.attendanceRate} confirmedRides={rider.totalRides} />
          <BadgePill label={badge.label} color={badge.color} background={badge.background} border={badge.border} />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center gap-0.5 rounded-xl border border-[#2A2A2A] bg-[#151515] py-2.5 text-center">
        <span className="text-sm font-bold text-[#F0F0F0]">{rider.ridesOrganised}</span>
        <span className="text-[9px] uppercase tracking-wide text-[#888888]">Rides organised</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 rounded-xl border border-[#2A2A2A] bg-[#151515] py-2.5 text-center">
        <span className="text-sm font-bold text-[#F0F0F0]">{rider.organiserAvgAttendance}%</span>
        <span className="text-[9px] uppercase tracking-wide text-[#888888]">Avg attendance</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 rounded-xl border border-[#2A2A2A] bg-[#151515] py-2.5 text-center">
        <span className="text-sm font-bold text-[#F0F0F0]">{rider.organiserAvgFillRate}%</span>
        <span className="text-[9px] uppercase tracking-wide text-[#888888]">Avg fill rate</span>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-[#888888]">{rider.city}</span>
      <button
        type="button"
        onClick={onInvite}
        disabled={isCaptain || invitePending}
        className={cn(
          "shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition-transform active:scale-[0.98]",
          isCaptain || invitePending
            ? "cursor-default border-[#555555] text-[#888888]"
            : "border-[#FF6600] text-[#FF6600]"
        )}
      >
        {isCaptain ? "Captain" : invitePending ? "Invite sent" : "Invite as captain"}
      </button>
    </div>
  </div>
);

export default OrganiserCard;
