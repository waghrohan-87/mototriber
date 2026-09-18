import BadgePill from "@/components/shared/BadgePill";
import {
  AttendanceTier,
  formatIgniterLabel,
  IGNITER_BADGE,
  NO_ATTENDANCE_BADGE_DESCRIPTION,
  OrganiserBadgeTier,
} from "@/lib/reputation";

interface ReputationBlockProps {
  participationTier: AttendanceTier | null;
  organiserBadge: OrganiserBadgeTier | null;
  igniterCount?: number;
}

const ReputationBlock = ({ participationTier, organiserBadge, igniterCount = 0 }: ReputationBlockProps) => {
  const hasIgniter = igniterCount > 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-[#888888]">Rider reputation</span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {participationTier && (
          <BadgePill
            label={participationTier.label}
            color={participationTier.color}
            background={participationTier.background}
            border={participationTier.border}
          />
        )}
        {organiserBadge && (
          <BadgePill
            label={organiserBadge.label}
            color={organiserBadge.color}
            background={organiserBadge.background}
            border={organiserBadge.border}
          />
        )}
        {hasIgniter && (
          <BadgePill
            label={formatIgniterLabel(igniterCount)}
            color={IGNITER_BADGE.color}
            background={IGNITER_BADGE.background}
            border={IGNITER_BADGE.border}
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] text-[#888888]">
          {participationTier ? participationTier.description : NO_ATTENDANCE_BADGE_DESCRIPTION}
        </span>
        {organiserBadge && <span className="text-[11px] text-[#888888]">{organiserBadge.description}</span>}
        {hasIgniter && <span className="text-[11px] text-[#888888]">{IGNITER_BADGE.description}</span>}
      </div>
    </div>
  );
};

export default ReputationBlock;
