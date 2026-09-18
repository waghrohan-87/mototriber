import { Calendar, CheckCircle2, Clock, Pencil, X } from "lucide-react";
import { Ride } from "@/components/discover/RideCard";
import { getRideStatus } from "@/lib/rideStatus";

interface AdminRideItemProps {
  ride: Ride;
  onEdit?: () => void;
  onCancel?: () => void;
  onConfirmAttendance?: () => void;
}

const AdminRideItem = ({ ride, onEdit, onCancel, onConfirmAttendance }: AdminRideItemProps) => {
  const expired = getRideStatus(ride) === "expired";

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-bold leading-tight text-[#F0F0F0]">{ride.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#888888]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {ride.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {ride.time}
          </span>
        </div>
      </div>

      {ride.isPast ? (
        ride.attendanceConfirmed ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#16A34A]">
            <CheckCircle2 className="h-4 w-4" />
            Confirmed
          </span>
        ) : expired ? (
          <span className="shrink-0 rounded-full bg-[#2A2A2A] px-3 py-1.5 text-xs font-bold text-[#888888]">
            Expired
          </span>
        ) : (
          <button
            type="button"
            onClick={onConfirmAttendance}
            className="shrink-0 rounded-full border border-[#FF6600] px-3 py-1.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-95"
          >
            Confirm attendance
          </button>
        )
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit ride"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333333] text-[#AAAAAA] transition-colors active:bg-[#222222]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel ride"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DC2626]/40 text-[#DC2626] transition-colors active:bg-[#DC2626]/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminRideItem;
