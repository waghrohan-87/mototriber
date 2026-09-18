import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIN_CONFIRMED_RIDES } from "@/lib/reputation";

interface AttendanceStatProps {
  attendanceRate: number;
  confirmedRides: number;
  variant?: "block" | "inline";
  showCaption?: boolean;
}

const AttendanceStat = ({ attendanceRate, confirmedRides, variant = "block", showCaption }: AttendanceStatProps) => {
  const building = confirmedRides < MIN_CONFIRMED_RIDES;
  const value = building ? "Building reputation" : `${attendanceRate}%`;

  if (variant === "inline") {
    return (
      <span className={cn("flex items-center gap-1", building && "text-[#888888]")}>
        <ShieldCheck className="h-3 w-3 text-[#888888]" />
        {building ? value : `${value} attendance`}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn(building ? "text-sm font-bold text-[#888888]" : "text-lg font-bold text-[#F0F0F0]")}>
        {value}
      </span>
      <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">Attendance</span>
      {showCaption && (
        <span className="text-center text-[10px] text-[#666666]">Confirmed by ride organisers and captains.</span>
      )}
    </div>
  );
};

export default AttendanceStat;
