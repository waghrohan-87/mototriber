import { Flag, MoreVertical, Shield, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/components/club-registration/clubRegistrationTypes";
import { ClubMemberRecord } from "@/lib/clubMembers";

const ROLE_STYLES: Record<string, string> = {
  member: "bg-[#2A2A2A] text-[#AAAAAA]",
  "co-admin": "bg-[#153552] text-[#7EB8FF]",
  captain: "bg-[#FF6600]/15 text-[#FF6600]",
};

const ROLE_LABEL: Record<string, string> = { member: "Member", "co-admin": "Co-admin", captain: "Captain" };

interface ClubMemberRowProps {
  member: ClubMemberRecord;
  isClubOwner: boolean;
  onMakeCoAdmin: () => void;
  onRemoveCoAdmin: () => void;
  onAssignCaptain: () => void;
  onRemoveCaptain: () => void;
  onRemove: () => void;
}

const ClubMemberRow = ({
  member,
  isClubOwner,
  onMakeCoAdmin,
  onRemoveCoAdmin,
  onAssignCaptain,
  onRemoveCaptain,
  onRemove,
}: ClubMemberRowProps) => {
  const displayName = member.fullName || member.username || "Rider";

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] px-3.5 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A1608] text-sm font-bold text-[#FF9D4D]">
        {getInitials(displayName)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold leading-tight text-[#F0F0F0]">
            {member.username ? `@${member.username}` : displayName}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_STYLES[member.role]}`}>
            {ROLE_LABEL[member.role]}
          </span>
        </div>
        {member.city && <p className="truncate text-xs leading-tight text-[#888888]">{member.city}</p>}
      </div>

      {!isClubOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${displayName}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#888888] transition-colors active:bg-[#222222]"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
            {member.role !== "co-admin" && (
              <DropdownMenuItem onClick={onMakeCoAdmin} className="gap-2 focus:bg-[#222222] focus:text-[#F0F0F0]">
                <Shield className="h-4 w-4" /> Make co-admin
              </DropdownMenuItem>
            )}
            {member.role === "co-admin" && (
              <DropdownMenuItem onClick={onRemoveCoAdmin} className="gap-2 focus:bg-[#222222] focus:text-[#F0F0F0]">
                <Shield className="h-4 w-4" /> Remove co-admin
              </DropdownMenuItem>
            )}
            {member.role !== "captain" && (
              <DropdownMenuItem onClick={onAssignCaptain} className="gap-2 focus:bg-[#222222] focus:text-[#F0F0F0]">
                <Flag className="h-4 w-4" /> Assign as captain
              </DropdownMenuItem>
            )}
            {member.role === "captain" && (
              <DropdownMenuItem onClick={onRemoveCaptain} className="gap-2 focus:bg-[#222222] focus:text-[#F0F0F0]">
                <Flag className="h-4 w-4" /> Remove captain
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onRemove} className="gap-2 text-[#DC2626] focus:bg-[#DC2626]/10 focus:text-[#DC2626]">
              <UserMinus className="h-4 w-4" /> Remove from club
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ClubMemberRow;
