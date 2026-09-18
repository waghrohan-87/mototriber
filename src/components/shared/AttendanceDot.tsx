import { getAttendanceTier } from "@/lib/reputation";

interface AttendanceDotProps {
  attendanceRate: number;
  confirmedRides: number;
  ringColor?: string;
}

const AttendanceDot = ({ attendanceRate, confirmedRides, ringColor = "#111111" }: AttendanceDotProps) => {
  const tier = getAttendanceTier(attendanceRate, confirmedRides);
  if (!tier) return null;

  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
      style={{ backgroundColor: tier.border, borderColor: ringColor }}
    />
  );
};

export default AttendanceDot;
