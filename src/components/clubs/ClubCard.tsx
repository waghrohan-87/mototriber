import { Users, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import BikeTagPill from "@/components/shared/BikeTagPill";

export type ClubCategory = "RE clubs" | "Adventure" | "Women" | "Sports" | "Touring";

export type ClubMembershipStatus = "none" | "pending" | "member";

export interface ClubAnnouncement {
  id: string;
  text: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  bikeType: string;
  city: string;
  category: ClubCategory;
  avatarUrl: string;
  members: number;
  ridesPerYear: number;
  following: boolean;
  description: string;
  verified: boolean;
  ridesOrganised: number;
  avgAttendanceRate: number;
  whatsappNumber?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  memberIds: string[];
  captainId?: string;
  coAdminIds: string[];
  pendingRequestIds: string[];
  announcements: ClubAnnouncement[];
  active: boolean;
  adminHandle: string;
  membershipStatus: ClubMembershipStatus;
}

interface ClubCardProps {
  club: Club;
  onToggleFollow: () => void;
  onOpen?: () => void;
}

const ClubCard = ({ club, onToggleFollow, onOpen }: ClubCardProps) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-2xl border border-[#333333] bg-[#1a1a1a] p-4 text-left transition-colors active:border-[#FF6600]/50"
    >
      <img
        src={club.avatarUrl}
        alt={club.name}
        className="h-11 w-11 shrink-0 rounded-xl border border-[#333333] object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-[15px] font-bold leading-snug text-[#F0F0F0]">
          {club.name}
        </h3>
        <p className="truncate text-xs text-[#888888]">{club.city}</p>
        <BikeTagPill label={club.bikeType} />
        <div className="flex items-center gap-3 text-[11px] text-[#AAAAAA]">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#888888]" />
            {club.members.toLocaleString()} members
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3 text-[#888888]" />
            {club.ridesPerYear} rides/yr
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
          club.following
            ? "bg-[#FF6600] text-white"
            : "border border-[#FF6600] text-[#FF6600]"
        )}
      >
        {club.following ? "Following" : "Follow"}
      </span>
    </button>
  );
};

export default ClubCard;
