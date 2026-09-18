import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import BikeTagPill from "@/components/shared/BikeTagPill";
import { getInitials } from "@/components/club-registration/clubRegistrationTypes";

export interface DirectoryClub {
  id: number;
  name: string;
  city: string;
  bikeTypeFocus: string;
  logoUrl: string | null;
  memberCount: number;
  following: boolean;
}

interface DirectoryClubCardProps {
  club: DirectoryClub;
  onToggleFollow: () => void;
  onOpen: () => void;
}

const DirectoryClubCard = ({ club, onToggleFollow, onOpen }: DirectoryClubCardProps) => (
  <button
    type="button"
    onClick={onOpen}
    className="flex items-center gap-3 rounded-2xl border border-[#333333] bg-[#1a1a1a] p-4 text-left transition-colors active:border-[#FF6600]/50"
  >
    {club.logoUrl ? (
      <img
        src={club.logoUrl}
        alt={club.name}
        className="h-11 w-11 shrink-0 rounded-xl border border-[#333333] object-cover"
      />
    ) : (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#333333] bg-[#2A1608] text-sm font-bold text-[#FF9D4D]">
        {getInitials(club.name)}
      </span>
    )}

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <h3 className="truncate text-[15px] font-bold leading-snug text-[#F0F0F0]">{club.name}</h3>
      <p className="truncate text-xs text-[#888888]">{club.city}</p>
      <div className="flex items-center gap-2">
        <BikeTagPill label={club.bikeTypeFocus} />
        <span className="flex items-center gap-1 text-[11px] text-[#AAAAAA]">
          <Users className="h-3 w-3 text-[#888888]" />
          {club.memberCount} {club.memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </div>

    <span
      onClick={(e) => {
        e.stopPropagation();
        onToggleFollow();
      }}
      role="button"
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-transform active:scale-95",
        club.following ? "bg-[#FF6600] text-white" : "border border-[#FF6600] text-[#FF6600]"
      )}
    >
      {club.following ? "Following" : "Follow"}
    </span>
  </button>
);

export default DirectoryClubCard;
