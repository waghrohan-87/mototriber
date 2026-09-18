import { Calendar, Clock, Facebook, Gauge, Instagram, Lock, MapPin, Check, MessageCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type RideType = "club" | "open" | "private";

export type SourcePlatform = "Reddit" | "Facebook" | "Instagram" | "WhatsApp";

export interface Comment {
  id: string;
  name: string;
  text: string;
  time: string;
}

export interface RideUpdate {
  type: "edited" | "cancelled";
  reason: string;
  authorName: string;
  timestamp: string;
}

export interface Ride {
  id: string;
  title: string;
  type: RideType;
  date: string;
  time: string;
  distance: string;
  meetingPoint: string;
  poster: { name: string };
  spotsTaken: number;
  spotsTotal: number;
  joined: boolean;
  requestOnly?: boolean;
  requested?: boolean;
  joinedRiders?: string[];
  viewerIsClubMember?: boolean;
  isPast?: boolean;
  attendanceConfirmed?: boolean;
  endedAt?: string;
  pendingRequestNames?: string[];
  attendedRiders?: string[];
  isCancelled?: boolean;
  updates?: RideUpdate[];
  updateSeenBy?: string[];
  comments?: Comment[];
  description?: string;
  isSeeded?: boolean;
  sourcePlatform?: SourcePlatform;
  claimStatus?: "unclaimed" | "claimed";
}

export const BADGE_STYLES: Record<RideType, string> = {
  club: "bg-[#1E3A8A]/30 text-[#60A5FA] border border-[#3B82F6]/40",
  open: "bg-[#FF6600]/15 text-[#FF9D4D] border border-[#FF6600]/40",
  private: "bg-[#2A2A2A] text-[#AAAAAA] border border-[#3A3A3A]",
};

export const BADGE_LABEL: Record<RideType, string> = {
  club: "Club",
  open: "Open to all",
  private: "Private",
};

export const AVATAR_STYLES: Record<RideType, { background: string; color: string }> = {
  club: { background: "rgba(59,130,246,0.2)", color: "#60A5FA" },
  open: { background: "rgba(255,102,0,0.2)", color: "#FF6600" },
  private: { background: "rgba(136,136,136,0.2)", color: "#888888" },
};

export const SOURCE_PLATFORM_ICON: Record<SourcePlatform, typeof MessageCircle> = {
  Reddit: MessageSquare,
  Facebook: Facebook,
  Instagram: Instagram,
  WhatsApp: MessageCircle,
};

export const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
};

interface RideCardProps {
  ride: Ride;
  onRsvp: () => void;
  onOpen?: () => void;
}

const RideCard = ({ ride, onRsvp, onOpen }: RideCardProps) => {
  const isPrivate = ride.type === "private";
  const isUnclaimedSeed = Boolean(ride.isSeeded) && ride.claimStatus === "unclaimed";
  const SourceIcon = ride.sourcePlatform ? SOURCE_PLATFORM_ICON[ride.sourcePlatform] : null;

  const rsvpLabel = ride.joined
    ? "Going"
    : ride.requested
    ? "Request sent"
    : ride.requestOnly
    ? "Request to join"
    : "Join";
  const rsvpStyles = ride.joined
    ? "bg-[#16A34A] text-white"
    : ride.requested
    ? "border border-[#555555] text-[#666666] cursor-default"
    : ride.requestOnly
    ? "border border-[#555555] text-[#AAAAAA]"
    : "bg-[#FF6600] text-white";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border border-[#333333] bg-[#1a1a1a] p-4 text-left transition-colors active:border-[#FF6600]/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold leading-snug text-[#F0F0F0]">{ride.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {isUnclaimedSeed && (
            <span className="rounded-full bg-[#333333] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#AAAAAA]">
              Unclaimed
            </span>
          )}
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              BADGE_STYLES[ride.type]
            )}
          >
            {isPrivate && <Lock className="h-3 w-3" />}
            {BADGE_LABEL[ride.type]}
          </span>
        </div>
      </div>

      {isUnclaimedSeed && SourceIcon && (
        <div className="-mt-2 flex items-center gap-1.5 text-xs text-[#888888]">
          <SourceIcon className="h-3.5 w-3.5" />
          <span>Spotted on {ride.sourcePlatform}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888888]">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {ride.date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {ride.time}
        </span>
        <span className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" />
          {ride.distance}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#888888]" />
        <span className="truncate">{ride.meetingPoint}</span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#2A2A2A] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: AVATAR_STYLES[ride.type].background,
              color: AVATAR_STYLES[ride.type].color,
            }}
          >
            {getInitials(ride.poster.name)}
          </span>
          <span className="truncate text-xs font-medium text-[#F0F0F0]">{ride.poster.name}</span>
        </div>

        <span className="shrink-0 text-xs font-semibold text-[#888888]">
          {isPrivate ? "Invite only" : `${ride.spotsTaken}/${ride.spotsTotal} spots`}
        </span>

        <span
          onClick={(e) => {
            e.stopPropagation();
            onRsvp();
          }}
          role="button"
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition-transform active:scale-95",
            rsvpStyles
          )}
        >
          {ride.joined && !ride.requestOnly && <Check className="h-3.5 w-3.5" />}
          {rsvpLabel}
        </span>
      </div>
    </button>
  );
};

export default RideCard;
