export interface AttendanceTier {
  key: "ironclad" | "throttle" | "gearhead";
  label: string;
  color: string;
  background: string;
  border: string;
  description: string;
}

export const MIN_CONFIRMED_RIDES = 5;

export const NO_ATTENDANCE_BADGE_DESCRIPTION = "Building reputation — fewer than 5 confirmed rides";

const TIERS: AttendanceTier[] = [
  {
    key: "ironclad",
    label: "Trailblazer",
    color: "#C0C0C0",
    background: "rgba(192,192,192,0.15)",
    border: "#C0C0C0",
    description: "Never missed a ride — 100% attendance",
  },
  {
    key: "throttle",
    label: "Road Dog",
    color: "#FF6600",
    background: "rgba(255,102,0,0.15)",
    border: "#FF6600",
    description: "Rarely misses a ride — 90–99% attendance",
  },
  {
    key: "gearhead",
    label: "Roadworthy",
    color: "#CD7F32",
    background: "rgba(205,127,50,0.15)",
    border: "#CD7F32",
    description: "Dependable rider — 80–89% attendance",
  },
];

export const getAttendanceTier = (attendanceRate: number, confirmedRides: number): AttendanceTier | null => {
  if (confirmedRides < MIN_CONFIRMED_RIDES) return null;
  if (attendanceRate === 100) return TIERS[0];
  if (attendanceRate >= 90) return TIERS[1];
  if (attendanceRate >= 80) return TIERS[2];
  return null;
};

export interface OrganiserBadgeTier {
  key: "ride-leader" | "pack-master" | "legend";
  label: string;
  color: string;
  background: string;
  border: string;
  description: string;
}

const ORGANISER_TIERS: OrganiserBadgeTier[] = [
  {
    key: "legend",
    label: "Legend",
    color: "#FFD700",
    background: "rgba(255,215,0,0.15)",
    border: "#FFD700",
    description: "Elite organiser — 25+ rides run with 90%+ attendance",
  },
  {
    key: "pack-master",
    label: "Pack Master",
    color: "#C0C0C0",
    background: "rgba(192,192,192,0.15)",
    border: "#C0C0C0",
    description: "Experienced organiser — 10+ rides run with 85%+ attendance",
  },
  {
    key: "ride-leader",
    label: "Ride Leader",
    color: "#FF6600",
    background: "rgba(255,102,0,0.15)",
    border: "#FF6600",
    description: "Active organiser — 3+ rides run with 75%+ attendance",
  },
];

export const getOrganiserBadge = (
  ridesOrganised: number,
  avgAttendanceRate: number,
  avgFillRate: number
): OrganiserBadgeTier | null => {
  if (ridesOrganised >= 25 && avgAttendanceRate >= 90 && avgFillRate >= 90) return ORGANISER_TIERS[0];
  if (ridesOrganised >= 10 && avgAttendanceRate >= 85 && avgFillRate >= 90) return ORGANISER_TIERS[1];
  if (ridesOrganised >= 3 && avgAttendanceRate >= 75) return ORGANISER_TIERS[2];
  return null;
};

export const IGNITER_BADGE = {
  color: "#FF3D00",
  background: "rgba(255,61,0,0.15)",
  border: "#FF3D00",
  description: "Igniter — claimed and coordinated a community ride",
};

export const formatIgniterLabel = (count: number) => (count > 1 ? `Igniter x${count}` : "Igniter");

export const getOrganiserAttendanceBadge = (
  ridesOrganised: number,
  avgAttendanceRate: number
): OrganiserBadgeTier | null => {
  if (ridesOrganised >= 25 && avgAttendanceRate >= 90) return ORGANISER_TIERS[0];
  if (ridesOrganised >= 10 && avgAttendanceRate >= 85) return ORGANISER_TIERS[1];
  if (ridesOrganised >= 3 && avgAttendanceRate >= 75) return ORGANISER_TIERS[2];
  return null;
};
