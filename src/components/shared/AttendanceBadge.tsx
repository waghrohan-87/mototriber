import { cn } from "@/lib/utils";
import { getAttendanceTier, MIN_CONFIRMED_RIDES } from "@/lib/reputation";

interface AttendanceBadgeProps {
  attendanceRate: number;
  confirmedRides: number;
  className?: string;
}

const AttendanceBadge = ({ attendanceRate, confirmedRides, className }: AttendanceBadgeProps) => {
  if (confirmedRides < MIN_CONFIRMED_RIDES) {
    return <span className={cn("text-[11px] font-semibold text-[#888888]", className)}>Building reputation</span>;
  }

  const tier = getAttendanceTier(attendanceRate, confirmedRides);

  if (!tier) {
    return (
      <span className={cn("text-[11px] font-semibold text-[#888888]", className)}>{attendanceRate}% attendance</span>
    );
  }

  return (
    <span
      className={cn("inline-flex w-fit items-center rounded-[20px] px-[10px] py-[3px] text-[11px] font-semibold leading-none", className)}
      style={{ color: tier.color, backgroundColor: tier.background, border: `1px solid ${tier.border}` }}
    >
      {tier.label}
    </span>
  );
};

export default AttendanceBadge;
