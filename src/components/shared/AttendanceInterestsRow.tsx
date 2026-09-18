import { cn } from "@/lib/utils";
import { MIN_CONFIRMED_RIDES } from "@/lib/reputation";
import { RidingInterest } from "./ridingInterests";

interface AttendanceInterestsRowProps {
  attendanceRate: number;
  confirmedRides: number;
  interests: RidingInterest[];
}

const AttendanceInterestsRow = ({ attendanceRate, confirmedRides, interests }: AttendanceInterestsRowProps) => {
  const building = confirmedRides < MIN_CONFIRMED_RIDES;
  const visibleInterests = interests.slice(0, 2);

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
      <span className={cn("shrink-0 font-semibold", building ? "text-[#888888]" : "text-[#AAAAAA]")}>
        {building ? "Building reputation" : `${attendanceRate}%`}
      </span>
      {visibleInterests.length > 0 && (
        <>
          <span className="shrink-0 text-[#555555]">&middot;</span>
          <div className="flex min-w-0 items-center gap-1">
            {visibleInterests.map((interest) => (
              <span
                key={interest}
                className="truncate rounded-full bg-[#2A2A2A] px-2 py-0.5 text-[10px] font-semibold leading-none text-[#AAAAAA]"
              >
                {interest}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceInterestsRow;
