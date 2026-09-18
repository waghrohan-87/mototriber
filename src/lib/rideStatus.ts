import { Ride } from "@/components/discover/RideCard";

export type RideStatus = "upcoming" | "pending" | "complete" | "expired";

export const CONFIRMATION_EXPIRY_HOURS = 96;

export const getRideStatus = (ride: Ride): RideStatus => {
  if (!ride.isPast) return "upcoming";
  if (ride.attendanceConfirmed) return "complete";
  if (ride.endedAt) {
    const hoursSinceEnded = (Date.now() - new Date(ride.endedAt).getTime()) / (3600 * 1000);
    if (hoursSinceEnded >= CONFIRMATION_EXPIRY_HOURS) return "expired";
  }
  return "pending";
};

export const getRideAttendanceRate = (ride: Ride): number => {
  const joined = ride.joinedRiders?.length ?? 0;
  if (joined === 0) return 0;
  const attended = ride.attendedRiders?.length ?? joined;
  return (attended / joined) * 100;
};

export const getRideFillRate = (ride: Ride): number =>
  ride.spotsTotal > 0 ? (ride.spotsTaken / ride.spotsTotal) * 100 : 0;
