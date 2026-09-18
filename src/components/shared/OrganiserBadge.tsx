import BadgePill from "@/components/shared/BadgePill";
import { getOrganiserBadge } from "@/lib/reputation";

interface OrganiserBadgeProps {
  ridesOrganised: number;
  avgAttendanceRate: number;
  avgFillRate: number;
  className?: string;
}

const OrganiserBadge = ({ ridesOrganised, avgAttendanceRate, avgFillRate, className }: OrganiserBadgeProps) => {
  const badge = getOrganiserBadge(ridesOrganised, avgAttendanceRate, avgFillRate);
  if (!badge) return null;

  return <BadgePill label={badge.label} color={badge.color} background={badge.background} border={badge.border} className={className} />;
};

export default OrganiserBadge;
