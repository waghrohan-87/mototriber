import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Check, Gauge, Route, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { avatarTintForName } from "@/lib/avatarTint";
import { AvatarTint } from "@/components/riders/RiderCard";
import { MIN_CONFIRMED_RIDES, getAttendanceTier, getOrganiserAttendanceBadge } from "@/lib/reputation";
import BikeTagPill from "@/components/shared/BikeTagPill";
import RidingInterestPills from "@/components/shared/RidingInterestPills";
import ReputationBlock from "@/components/shared/ReputationBlock";
import AttendanceStat from "@/components/shared/AttendanceStat";
import RideSummaryCard, { RideSummary, RideVisibility } from "@/components/profile/RideSummaryCard";
import ClubMembershipList from "@/components/profile/ClubMembershipList";
import { useUserClubs } from "@/hooks/useUserClubs";
import { RidingInterest } from "@/components/shared/ridingInterests";
import {
  ConnectButtonState,
  ConnectionRecord,
  acceptConnectionRequest,
  declineConnectionRequest,
  fetchConnectionsCount,
  fetchConnectionsForUser,
  formatRiderLabel,
  latestConnectionMap,
  resolveConnectionState,
  sendConnectRequest,
} from "@/lib/connections";
import { findOrCreateConversation } from "@/lib/messaging";

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

interface RiderProfileData {
  userId: number;
  name: string;
  handle: string;
  city: string;
  avatarTint: AvatarTint;
  bikes: string[];
  ridingInterests: RidingInterest[];
  totalRides: number;
  attendanceRate: number;
  noShowCount: number;
  ridesOrganised: number;
  organiserAvgAttendance: number;
  kmRidden: number;
  rides: RideSummary[];
}

const RiderProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const targetUserId = id ? Number(id) : NaN;

  const [rider, setRider] = useState<RiderProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [connectionRecord, setConnectionRecord] = useState<ConnectionRecord | undefined>(undefined);
  const [actionPending, setActionPending] = useState(false);
  const [clubsExpanded, setClubsExpanded] = useState(false);
  const [showConnectHint, setShowConnectHint] = useState(false);

  const connectionState: ConnectButtonState = user
    ? resolveConnectionState(user.userId, connectionRecord)
    : "connect";
  const isConnected = connectionState === "connected";

  const { clubs: riderClubs, loading: riderClubsLoading } = useUserClubs(
    Number.isFinite(targetUserId) ? targetUserId : null,
    Number.isFinite(targetUserId)
  );

  const loadRider = useCallback(async () => {
    if (!Number.isFinite(targetUserId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: targetUserId }],
      });
      if (profileError) throw new Error(profileError);
      const row = profileData?.List?.[0] as Record<string, unknown> | undefined;
      if (!row) {
        setRider(null);
        return;
      }

      const name = String(row.full_name || row.username || "Rider");
      const username = String(row.username || "");

      const { data: participantData, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        { PageNo: 1, PageSize: 1000, Filters: [{ name: "user_id", op: "Equal", value: targetUserId }] }
      );
      if (participantError) throw new Error(participantError);
      const participantRows = (participantData?.List ?? []) as Record<string, unknown>[];

      const joinedRows = participantRows.filter((r) => ["joined", "accepted"].includes(String(r.join_status ?? "")));
      const joinedRideIds = Array.from(new Set(joinedRows.map((r) => Number(r.ride_id))));

      const confirmedRows = participantRows.filter((r) =>
        ["attended", "not_attended"].includes(String(r.attended ?? ""))
      );
      const attendedRows = confirmedRows.filter((r) => String(r.attended) === "attended");
      const attendanceRate =
        confirmedRows.length >= MIN_CONFIRMED_RIDES
          ? Math.round((attendedRows.length / confirmedRows.length) * 100)
          : 0;
      const attendedRideIds = new Set(attendedRows.map((r) => Number(r.ride_id)));
      const noShowCount = joinedRows.filter((r) => String(r.attended ?? "") === "not_attended").length;

      const { data: createdData, error: createdError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 500,
        Filters: [{ name: "creator_user_id", op: "Equal", value: targetUserId }],
      });
      if (createdError) throw new Error(createdError);
      const createdRows = (createdData?.List ?? []) as Record<string, unknown>[];
      const createdRideIds = new Set(createdRows.map((r) => Number(r.ID ?? r.id)));

      const joinedOnlyIds = joinedRideIds.filter((rideId) => !createdRideIds.has(rideId));
      const joinedOnlyResults = await Promise.all(
        joinedOnlyIds.map((rideId) =>
          window.ezsite.apis.tablePage("rides", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "ID", op: "Equal", value: rideId }],
          })
        )
      );
      const joinedOnlyRows = joinedOnlyResults
        .map((res) => res.data?.List?.[0] as Record<string, unknown> | undefined)
        .filter((r): r is Record<string, unknown> => Boolean(r));

      const rideById = new Map<number, Record<string, unknown>>();
      [...createdRows, ...joinedOnlyRows].forEach((r) => rideById.set(Number(r.ID ?? r.id), r));

      const kmRidden = Array.from(attendedRideIds).reduce((sum, rideId) => {
        const rideRow = rideById.get(rideId);
        return sum + (rideRow ? Number(rideRow.distance_km ?? 0) : 0);
      }, 0);

      const organisedRows = createdRows.filter((r) => ["complete", "expired"].includes(String(r.status ?? "")));
      let organiserAvgAttendance = 0;
      if (organisedRows.length > 0) {
        const rideRates = await Promise.all(
          organisedRows.map(async (r) => {
            const rideId = Number(r.ID ?? r.id);
            const { data: rideParticipantData } = await window.ezsite.apis.tablePage("ride_participants", {
              PageNo: 1,
              PageSize: 500,
              Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
            });
            const rows = (rideParticipantData?.List ?? []) as Record<string, unknown>[];
            const going = rows.filter((row) => ["joined", "accepted"].includes(String(row.join_status ?? "")));
            const attended = going.filter((row) => String(row.attended) === "attended");
            return going.length > 0 ? (attended.length / going.length) * 100 : 0;
          })
        );
        organiserAvgAttendance = Math.round(rideRates.reduce((sum, rate) => sum + rate, 0) / rideRates.length);
      }

      const rides: RideSummary[] = Array.from(rideById.values())
        .sort((a, b) => new Date(String(b.ride_date ?? 0)).getTime() - new Date(String(a.ride_date ?? 0)).getTime())
        .slice(0, 10)
        .map((r) => {
          const rideDate = String(r.ride_date ?? "");
          let formattedDate = rideDate;
          try {
            formattedDate = rideDate ? format(new Date(rideDate), "EEE, MMM d") : "";
          } catch {
            formattedDate = rideDate;
          }
          return {
            id: String(r.ID ?? r.id),
            title: String(r.title ?? ""),
            date: formattedDate,
            distance: `${r.distance_km ?? 0} km`,
            visibility: String(r.visibility ?? "public") as RideVisibility,
          };
        });

      setRider({
        userId: targetUserId,
        name,
        handle: username ? `@${username}` : "@rider",
        city: String(row.city || ""),
        avatarTint: avatarTintForName(name),
        bikes: Array.isArray(row.bikes_owned) ? (row.bikes_owned as string[]) : [],
        ridingInterests: Array.isArray(row.riding_interests) ? (row.riding_interests as RidingInterest[]) : [],
        totalRides: joinedRideIds.length,
        attendanceRate,
        noShowCount,
        ridesOrganised: organisedRows.length,
        organiserAvgAttendance,
        kmRidden,
        rides,
      });

      const count = await fetchConnectionsCount(targetUserId);
      setConnectionsCount(count);
    } catch (err) {
      toast({
        title: "Couldn't load this profile",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const loadConnectionRecord = useCallback(async () => {
    if (!user || !Number.isFinite(targetUserId)) return;
    try {
      const records = await fetchConnectionsForUser(user.userId);
      const map = latestConnectionMap(records, user.userId);
      setConnectionRecord(map.get(targetUserId));
    } catch {
      setConnectionRecord(undefined);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    loadRider();
  }, [loadRider]);

  useEffect(() => {
    loadConnectionRecord();
  }, [loadConnectionRecord]);

  if (user && Number.isFinite(targetUserId) && targetUserId === user.userId) {
    return <Navigate to="/profile" replace />;
  }

  if (!loading && !rider) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">This rider could not be found.</p>
        <button
          onClick={() => navigate("/riders")}
          className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white"
        >
          Back to Riders
        </button>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111]">
        <p className="text-sm text-[#888888]">Loading profile...</p>
      </div>
    );
  }

  const handleClubsStatClick = () => {
    if (isConnected) {
      setClubsExpanded((prev) => !prev);
    } else {
      setShowConnectHint((prev) => !prev);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    setActionPending(true);
    try {
      await sendConnectRequest(user.userId, formatRiderLabel(user.username, user.fullName), rider.userId);
      await loadConnectionRecord();
    } catch (err) {
      toast({
        title: "Couldn't send request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !connectionRecord) return;
    setActionPending(true);
    try {
      await acceptConnectionRequest(connectionRecord, formatRiderLabel(user.username, user.fullName));
      await Promise.all([loadConnectionRecord(), loadRider()]);
      toast({ title: "Connection accepted" });
    } catch (err) {
      toast({
        title: "Couldn't accept request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleDecline = async () => {
    if (!connectionRecord) return;
    setActionPending(true);
    try {
      await declineConnectionRequest(connectionRecord);
      await loadConnectionRecord();
    } catch (err) {
      toast({
        title: "Couldn't decline request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    try {
      const conversation = await findOrCreateConversation(user.userId, rider.userId);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast({
        title: "Couldn't open conversation",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const participationTier = getAttendanceTier(rider.attendanceRate, rider.totalRides);
  const organiserBadge = getOrganiserAttendanceBadge(rider.ridesOrganised, rider.organiserAvgAttendance);

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
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 border-b border-[#2A2A2A] px-5 py-8 text-center">
            <span
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white",
                TINT_STYLES[rider.avatarTint]
              )}
            >
              {getInitials(rider.name)}
            </span>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-bold text-[#F0F0F0]">{rider.name}</h1>
              <p className="text-xs text-[#888888]">
                {rider.handle} &middot; {rider.city}
              </p>
            </div>
            <ReputationBlock participationTier={participationTier} organiserBadge={organiserBadge} />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {rider.bikes.map((bike) => (
                <BikeTagPill key={bike} label={bike} />
              ))}
            </div>
            <RidingInterestPills interests={rider.ridingInterests} />
          </div>

          <div className="flex items-start justify-center gap-10 border-b border-[#2A2A2A] px-5 py-4">
            <AttendanceStat attendanceRate={rider.attendanceRate} confirmedRides={rider.totalRides} showCaption />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-[#F0F0F0]">{rider.noShowCount}</span>
              <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">No-shows</span>
            </div>
          </div>

          {isConnected ? (
            <div className="border-b border-[#333333] px-4 py-5">
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold text-[#F0F0F0]">{rider.totalRides}</span>
                  <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">Rides</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold text-[#F0F0F0]">{rider.kmRidden.toLocaleString()}</span>
                  <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">km ridden</span>
                </div>
                <button
                  type="button"
                  onClick={handleClubsStatClick}
                  className="flex flex-col items-center gap-1 rounded-lg py-0.5 transition-colors active:bg-[#1a1a1a]"
                >
                  <span className="text-lg font-bold text-[#F0F0F0]">{riderClubs.length}</span>
                  <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">Clubs</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold text-[#F0F0F0]">{connectionsCount.toLocaleString()}</span>
                  <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">Connections</span>
                </div>
              </div>

              {clubsExpanded && (
                <div className="mt-4">
                  <ClubMembershipList clubs={riderClubs} loading={riderClubsLoading} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 border-b border-[#333333] px-5 py-5">
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] py-3">
                  <span className="flex items-center gap-1.5 text-lg font-bold text-[#F0F0F0]">
                    <Route className="h-4 w-4 text-[#888888]" />
                    {rider.totalRides}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[#888888]">Rides</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] py-3">
                  <span className="flex items-center gap-1.5 text-lg font-bold text-[#F0F0F0]">
                    <Gauge className="h-4 w-4 text-[#888888]" />
                    {rider.kmRidden.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[#888888]">km ridden</span>
                </div>
                <button
                  type="button"
                  onClick={handleClubsStatClick}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] py-3 transition-colors active:border-[#FF6600]/40"
                >
                  <span className="text-lg font-bold text-[#F0F0F0]">{riderClubs.length}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[#888888]">Clubs</span>
                </button>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] py-3">
                  <span className="flex items-center gap-1.5 text-lg font-bold text-[#F0F0F0]">
                    <Users className="h-4 w-4 text-[#888888]" />
                    {connectionsCount}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[#888888]">Connections</span>
                </div>
              </div>

              {showConnectHint && (
                <p className="text-center text-xs text-[#888888]">
                  Connect to see which clubs they ride with.
                </p>
              )}

              {connectionState === "requested" && (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-[#333333] py-3.5 text-sm font-bold text-[#888888]"
                >
                  Requested
                </button>
              )}

              {connectionState === "incoming" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={actionPending}
                    className="flex-1 rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={actionPending}
                    className="flex-1 rounded-xl border border-[#555555] py-3.5 text-sm font-bold text-[#AAAAAA] transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              )}

              {connectionState === "connect" && (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={actionPending}
                  className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  Connect
                </button>
              )}

              <p className="text-center text-xs text-[#888888]">
                Connect to see full profile and ride history.
              </p>
            </div>
          )}

          {isConnected && (
            <>
              <div className="border-b border-[#2A2A2A] px-5 py-5">
                <button
                  type="button"
                  onClick={handleMessage}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  Message
                </button>
              </div>

              <div className="flex flex-col gap-3 px-4 pb-6 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Rides</h2>
                {rider.rides.map((ride) => (
                  <RideSummaryCard key={ride.id} ride={ride} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RiderProfilePage;
