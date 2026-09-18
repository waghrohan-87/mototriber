import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import BikeTagPill from "@/components/shared/BikeTagPill";
import { RidingInterest } from "@/components/shared/ridingInterests";
import { RideSummary } from "@/components/profile/RideSummaryCard";
import { ConnectButtonState } from "@/lib/connections";

export type RiderCategory = "Near me" | "Adventure" | "Touring" | "RE riders" | "Women riders";

export type AvatarTint = "orange" | "blue" | "green" | "purple" | "teal";

export interface Rider {
  id: string;
  name: string;
  handle: string;
  city: string;
  category: RiderCategory;
  avatarTint: AvatarTint;
  bikes: string[];
  totalRides: number;
  attendanceRate: number;
  ridesOrganised: number;
  organiserAvgAttendance: number;
  organiserAvgFillRate: number;
  kmRidden: number;
  connections: number;
  clubs: number;
  connected: boolean;
  ridingInterests: RidingInterest[];
  rides: RideSummary[];
}

export interface RiderCardData {
  id: string;
  name: string;
  handle: string;
  city: string;
  avatarTint: AvatarTint;
  bikes: string[];
  attendanceRate: number | null;
  connected: boolean;
}

interface RiderCardProps {
  rider: RiderCardData;
  onToggleConnect?: () => void;
  onOpen?: () => void;
  connectionState?: ConnectButtonState;
  actionPending?: boolean;
  onConnect?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
}

const TINT_STYLES: Record<AvatarTint, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatHandle = (handle: string) =>
  handle.length > 20 ? `${handle.slice(0, 20)}...` : handle;

const RiderCard = ({
  rider,
  onToggleConnect,
  onOpen,
  connectionState,
  actionPending,
  onConnect,
  onAccept,
  onDecline,
  onMessage,
}: RiderCardProps) => {
  const attendanceLabel = rider.attendanceRate === null ? "Building reputation" : `${rider.attendanceRate}%`;
  const primaryBike = rider.bikes[0];

  const renderAction = () => {
    if (!connectionState) {
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleConnect?.();
          }}
          role="button"
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition-transform active:scale-95",
            rider.connected ? "bg-[#FF6600] text-white" : "border border-[#FF6600] text-[#FF6600]"
          )}
        >
          {rider.connected && <Check className="h-3.5 w-3.5" />}
          {rider.connected ? "Connected" : "Connect"}
        </span>
      );
    }

    if (actionPending) {
      return (
        <span className="flex shrink-0 items-center rounded-full border border-[#333333] px-3.5 py-1.5 text-xs font-bold text-[#666666]">
          ...
        </span>
      );
    }

    switch (connectionState) {
      case "requested":
        return (
          <span className="flex shrink-0 items-center rounded-full bg-[#333333] px-3.5 py-1.5 text-xs font-bold text-[#888888]">
            Requested
          </span>
        );
      case "incoming":
        return (
          <span className="flex shrink-0 items-center gap-1.5">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.();
              }}
              role="button"
              className="rounded-full bg-[#16A34A] px-3 py-1.5 text-xs font-bold text-white transition-transform active:scale-95"
            >
              Accept
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDecline?.();
              }}
              role="button"
              className="rounded-full border border-[#555555] px-3 py-1.5 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-95"
            >
              Decline
            </span>
          </span>
        );
      case "connected":
        return (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.();
            }}
            role="button"
            className="flex shrink-0 items-center rounded-full bg-[#FF6600] px-3.5 py-1.5 text-xs font-bold text-white transition-transform active:scale-95"
          >
            Message
          </span>
        );
      case "connect":
      default:
        return (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onConnect?.();
            }}
            role="button"
            className="flex shrink-0 items-center rounded-full border border-[#FF6600] px-3.5 py-1.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-95"
          >
            Connect
          </span>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-3 text-left transition-colors active:border-[#FF6600]/50"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          TINT_STYLES[rider.avatarTint]
        )}
      >
        {getInitials(rider.name)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-[13px] font-bold leading-tight text-[#F0F0F0]">{formatHandle(rider.handle)}</h3>
        <p className="text-xs leading-tight text-[#888888]">
          {attendanceLabel} &middot; {rider.city}
        </p>
        {primaryBike && <BikeTagPill label={primaryBike} />}
      </div>

      {renderAction()}
    </button>
  );
};

export default RiderCard;
