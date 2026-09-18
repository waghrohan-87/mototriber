import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInitials } from "@/components/discover/RideCard";
import { tintForName } from "@/lib/avatarTint";

interface RideInfo {
  id: number;
  title: string;
  rideDate: string;
  rideType: string;
  creatorUserId: number;
  captainUserId: number | null;
  status: string;
}

interface ParticipantRow {
  rowId: number;
  userId: number;
  name: string;
}

const AttendanceConfirmPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const rideId = Number(id);

  const [ride, setRide] = useState<RideInfo | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [present, setPresent] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadRide = async () => {
    setLoading(true);
    try {
      const { data: rideRows, error: rideError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "ID", op: "Equal", value: rideId }],
      });
      if (rideError) throw new Error(rideError);
      const row = rideRows?.List?.[0] as Record<string, unknown> | undefined;
      if (!row) {
        setRide(null);
        setNotFound(true);
        return;
      }

      const rideInfo: RideInfo = {
        id: rideId,
        title: String(row.title ?? ""),
        rideDate: String(row.ride_date ?? ""),
        rideType: String(row.ride_type ?? "open"),
        creatorUserId: Number(row.creator_user_id),
        captainUserId:
          row.captain_user_id != null && row.captain_user_id !== "" ? Number(row.captain_user_id) : null,
        status: String(row.status ?? ""),
      };

      const { data: participantRows, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        {
          PageNo: 1,
          PageSize: 500,
          Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
        }
      );
      if (participantError) throw new Error(participantError);
      const goingRows = ((participantRows?.List ?? []) as Record<string, unknown>[]).filter((r) =>
        ["joined", "accepted"].includes(String(r.join_status ?? ""))
      );

      const uniqueUserIds = Array.from(new Set(goingRows.map((r) => Number(r.user_id))));
      const nameByUserId = new Map<number, string>();
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const { data } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: uid }],
          });
          const name = String(
            (data?.List?.[0] as Record<string, unknown> | undefined)?.full_name ?? `Rider #${uid}`
          );
          nameByUserId.set(uid, name);
        })
      );

      const mappedParticipants: ParticipantRow[] = goingRows.map((r) => ({
        rowId: Number(r.ID ?? r.id),
        userId: Number(r.user_id),
        name: nameByUserId.get(Number(r.user_id)) ?? `Rider #${r.user_id}`,
      }));

      setRide(rideInfo);
      setParticipants(mappedParticipants);
      setPresent(new Set(mappedParticipants.map((p) => p.rowId)));
      setNotFound(false);
    } catch (err) {
      toast({
        title: "Couldn't load ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rideId) return;
    loadRide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  const isResponsible = useMemo(() => {
    if (!ride || !user) return false;
    if (ride.rideType === "club") {
      return ride.captainUserId != null ? ride.captainUserId === user.userId : ride.creatorUserId === user.userId;
    }
    return ride.creatorUserId === user.userId;
  }, [ride, user]);

  const canConfirm = ride != null && isResponsible && ride.status === "pending_confirmation";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111]">
        <p className="text-sm text-[#888888]">Loading ride...</p>
      </div>
    );
  }

  if (!ride || notFound || !canConfirm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] px-8 text-center text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">
          {ride ? "This ride's attendance can no longer be confirmed." : "This ride could not be found."}
        </p>
        <button onClick={() => navigate("/")} className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white">
          Back to home
        </button>
      </div>
    );
  }

  const togglePresent = (rowId: number) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const handleMarkAllAttended = () => {
    setPresent(new Set(participants.map((p) => p.rowId)));
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const updateResults = await Promise.all(
        participants.map((p) =>
          window.ezsite.apis.tableUpdate("ride_participants", {
            ID: p.rowId,
            attended: present.has(p.rowId) ? "attended" : "not_attended",
          })
        )
      );
      const participantError = updateResults.find((r) => r.error)?.error;
      if (participantError) throw new Error(participantError);

      const { error: rideUpdateError } = await window.ezsite.apis.tableUpdate("rides", {
        ID: ride.id,
        status: "complete",
      });
      if (rideUpdateError) throw new Error(rideUpdateError);

      toast({ title: "Ride marked complete.", description: "Attendance confirmed." });
      navigate(-1);
    } catch (err) {
      toast({
        title: "Couldn't confirm attendance",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      className="flex h-screen flex-col bg-[#111111] text-[#F0F0F0]"
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#333333] px-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-sm font-bold">Confirm attendance</h1>
          {participants.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAttended}
              className="shrink-0 rounded-full border border-[#FF6600] px-3 py-1.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-95"
            >
              Mark all as attended
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1 border-b border-[#2A2A2A] px-5 py-5">
            <h2 className="text-base font-bold text-[#F0F0F0]">{ride.title}</h2>
            <p className="text-xs text-[#888888]">{ride.rideDate}</p>
          </div>

          <div className="flex flex-col gap-3 px-5 py-5">
            <p className="text-xs text-[#888888]">
              Confirm who actually showed up. This finalises the ride and updates everyone's attendance record.
            </p>

            {participants.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#888888]">No riders had joined this ride.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {participants.map((p) => {
                  const checked = present.has(p.rowId);
                  const tint = tintForName(p.name);
                  return (
                    <button
                      key={p.rowId}
                      type="button"
                      onClick={() => togglePresent(p.rowId)}
                      className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5 text-left"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: tint.background, color: tint.color }}
                      >
                        {getInitials(p.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#F0F0F0]">{p.name}</span>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          checked ? "border-[#16A34A] bg-[#16A34A]" : "border-[#555555] bg-[#2A2A2A]"
                        )}
                      >
                        {checked ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-[#888888]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#333333] px-5 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            Confirm and complete ride
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceConfirmPage;
