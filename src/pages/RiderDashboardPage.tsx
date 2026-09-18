import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PenLine, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import TopBar from "@/components/layout/TopBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MIN_CONFIRMED_RIDES, getOrganiserAttendanceBadge } from "@/lib/reputation";
import { expirePendingRide, isPastConfirmationDeadline } from "@/lib/rideExpiry";
import { notifyWaitlistOnSpotOpen } from "@/lib/rideWaitlist";
import DashboardRideCard, { DashboardPinAlert } from "@/components/dashboard/DashboardRideCard";
import CreatedRideCard from "@/components/dashboard/CreatedRideCard";
import JoinRequestRow from "@/components/dashboard/JoinRequestRow";
import AttentionRow from "@/components/dashboard/AttentionRow";
import StatBox from "@/components/dashboard/StatBox";
import AttendanceBadge from "@/components/shared/AttendanceBadge";
import BadgePill from "@/components/shared/BadgePill";
import RideCardSkeleton from "@/components/discover/RideCardSkeleton";
import { fetchConnectedUserIds } from "@/lib/connections";

type RidesTab = "joined" | "created";

interface JoinRequestItem {
  rowId: number;
  rideId: number;
  rideTitle: string;
  rideType: string;
  requesterUserId: number;
  requesterName: string;
  attendancePct: number | null;
  isConnected: boolean;
}

interface JoinedDashboardRide {
  participantRowId: number;
  rideId: number;
  title: string;
  rideDate: string;
  creatorName: string;
  pinAlert: DashboardPinAlert;
}

interface CreatedDashboardRide {
  rideId: number;
  title: string;
  rideDate: string;
  status: string;
  joinedCount: number;
  maxRiders: number;
}

interface ParticipantStats {
  ridesJoined: number;
  confirmedRides: number;
  attendanceRate: number;
}

interface OrganiserStats {
  ridesOrganised: number;
  avgAttendance: number;
  expiredCount: number;
}

interface InvitationRide {
  rideId: number;
  title: string;
  rideDate: string;
}

const isResponsibleForRide = (row: Record<string, unknown>, userId: number) => {
  const rideType = String(row.ride_type ?? "");
  const creatorId = Number(row.creator_user_id);
  const captainId =
    row.captain_user_id != null && row.captain_user_id !== "" ? Number(row.captain_user_id) : null;
  if (rideType === "club") {
    return captainId != null ? captainId === userId : creatorId === userId;
  }
  return creatorId === userId;
};

const RiderDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const [tab, setTab] = useState<RidesTab>(
    (location.state as { ridesTab?: RidesTab } | null)?.ridesTab ?? "joined"
  );

  useEffect(() => {
    const ridesTab = (location.state as { ridesTab?: RidesTab } | null)?.ridesTab;
    if (ridesTab) {
      setTab(ridesTab);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [joinRequests, setJoinRequests] = useState<JoinRequestItem[]>([]);
  const [joinedRides, setJoinedRides] = useState<JoinedDashboardRide[]>([]);
  const [createdRides, setCreatedRides] = useState<CreatedDashboardRide[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [participantStats, setParticipantStats] = useState<ParticipantStats>({
    ridesJoined: 0,
    confirmedRides: 0,
    attendanceRate: 0,
  });
  const [organiserStats, setOrganiserStats] = useState<OrganiserStats>({
    ridesOrganised: 0,
    avgAttendance: 0,
    expiredCount: 0,
  });
  const [invitationRides, setInvitationRides] = useState<InvitationRide[]>([]);

  const loadInvitations = async (userId: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [creatorResult, captainResult] = await Promise.all([
        window.ezsite.apis.tablePage("rides", {
          PageNo: 1,
          PageSize: 500,
          Filters: [{ name: "creator_user_id", op: "Equal", value: userId }],
        }),
        window.ezsite.apis.tablePage("rides", {
          PageNo: 1,
          PageSize: 500,
          Filters: [{ name: "captain_user_id", op: "Equal", value: userId }],
        }),
      ]);
      if (creatorResult.error) throw new Error(creatorResult.error);
      if (captainResult.error) throw new Error(captainResult.error);

      const rideById = new Map<number, Record<string, unknown>>();
      [
        ...((creatorResult.data?.List ?? []) as Record<string, unknown>[]),
        ...((captainResult.data?.List ?? []) as Record<string, unknown>[]),
      ].forEach((row) => rideById.set(Number(row.ID ?? row.id), row));

      const candidates = Array.from(rideById.values()).filter((row) => isResponsibleForRide(row, userId));

      const toTransition = candidates.filter((row) => {
        const status = String(row.status ?? "");
        const rideDate = String(row.ride_date ?? "");
        return (status === "planned" || status === "live") && rideDate < today;
      });

      await Promise.all(
        toTransition.map(async (row) => {
          const rideId = Number(row.ID ?? row.id);
          const { error: updateError } = await window.ezsite.apis.tableUpdate("rides", {
            ID: rideId,
            status: "pending_confirmation",
          });
          if (updateError) throw new Error(updateError);
          row.status = "pending_confirmation";

          const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
            user_id: userId,
            type: "attendance_confirmed",
            message: `${String(row.title ?? "")} is done! Confirm who showed up.`,
            related_ride_id: rideId,
            is_read: "no",
            created_at: new Date().toISOString(),
          });
          if (notifyError) throw new Error(notifyError);
        })
      );

      const toExpire = candidates.filter((row) => {
        const status = String(row.status ?? "");
        if (status !== "pending_confirmation") return false;
        return isPastConfirmationDeadline(String(row.ride_date ?? ""), String(row.ride_time ?? ""));
      });

      await Promise.all(
        toExpire.map(async (row) => {
          const rideId = Number(row.ID ?? row.id);
          const expired = await expirePendingRide(rideId);
          if (expired) row.status = "expired";
        })
      );

      setInvitationRides(
        candidates
          .filter((row) => String(row.status ?? "") === "pending_confirmation")
          .map((row) => ({
            rideId: Number(row.ID ?? row.id),
            title: String(row.title ?? ""),
            rideDate: String(row.ride_date ?? ""),
          }))
      );
    } catch (err) {
      toast({
        title: "Couldn't load invitations",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadDashboardRides = async () => {
    if (!user) {
      setJoinedRides([]);
      setCreatedRides([]);
      setLoadingRides(false);
      return;
    }
    setLoadingRides(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const { data: rideRows, error: rideError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 500,
      });
      if (rideError) throw new Error(rideError);
      const allRides = (rideRows?.List ?? []) as Record<string, unknown>[];
      const rideById = new Map<number, Record<string, unknown>>();
      allRides.forEach((row) => rideById.set(Number(row.ID ?? row.id), row));

      const { data: participantRows, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        { PageNo: 1, PageSize: 2000 }
      );
      if (participantError) throw new Error(participantError);
      const allParticipants = (participantRows?.List ?? []) as Record<string, unknown>[];

      const joinedCountByRide = new Map<number, number>();
      allParticipants.forEach((row) => {
        const status = String(row.join_status ?? "");
        if (status === "joined" || status === "accepted") {
          const rideId = Number(row.ride_id);
          joinedCountByRide.set(rideId, (joinedCountByRide.get(rideId) ?? 0) + 1);
        }
      });

      const myParticipantRows = allParticipants.filter(
        (row) =>
          Number(row.user_id) === user.userId && ["joined", "accepted"].includes(String(row.join_status ?? ""))
      );

      const joinedCandidates = myParticipantRows
        .map((row) => {
          const rideId = Number(row.ride_id);
          const ride = rideById.get(rideId);
          if (!ride) return null;
          if (Number(ride.creator_user_id) === user.userId) return null;
          const rideDate = String(ride.ride_date ?? "");
          const status = String(ride.status ?? "");
          if (rideDate < today || status === "complete") return null;
          return {
            participantRowId: Number(row.ID ?? row.id),
            rideId,
            title: String(ride.title ?? ""),
            rideDate,
            creatorUserId: Number(ride.creator_user_id),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const creatorIds = Array.from(new Set(joinedCandidates.map((r) => r.creatorUserId)));
      const creatorNameById = new Map<number, string>();
      await Promise.all(
        creatorIds.map(async (creatorId) => {
          const { data: profileData } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: creatorId }],
          });
          const profile = profileData?.List?.[0] as Record<string, unknown> | undefined;
          creatorNameById.set(creatorId, String(profile?.full_name || profile?.username || `Rider #${creatorId}`));
        })
      );

      const pinAlertByRideId = new Map<number, DashboardPinAlert>();
      await Promise.all(
        joinedCandidates.map(async (r) => {
          const { data: pinnedData } = await window.ezsite.apis.tablePage("ride_comments", {
            PageNo: 1,
            PageSize: 1,
            OrderByField: "ID",
            IsAsc: false,
            Filters: [
              { name: "ride_id", op: "Equal", value: r.rideId },
              { name: "is_pinned", op: "Equal", value: "yes" },
            ],
          });
          const pinnedRow = pinnedData?.List?.[0] as Record<string, unknown> | undefined;
          if (!pinnedRow) return;

          const { data: seenData } = await window.ezsite.apis.tablePage("ride_last_seen", {
            PageNo: 1,
            PageSize: 1,
            Filters: [
              { name: "ride_id", op: "Equal", value: r.rideId },
              { name: "user_id", op: "Equal", value: user.userId },
            ],
          });
          const seenRow = seenData?.List?.[0] as Record<string, unknown> | undefined;
          const pinnedAt = new Date(String(pinnedRow.created_at ?? "")).getTime();
          const seenAt = seenRow ? new Date(String(seenRow.last_seen_at ?? "")).getTime() : null;

          if (seenAt === null || pinnedAt > seenAt) {
            pinAlertByRideId.set(r.rideId, { type: String(pinnedRow.pin_type ?? "edit") as "edit" | "cancel" });
          }
        })
      );

      setJoinedRides(
        joinedCandidates.map((r) => ({
          participantRowId: r.participantRowId,
          rideId: r.rideId,
          title: r.title,
          rideDate: r.rideDate,
          creatorName: creatorNameById.get(r.creatorUserId) ?? `Rider #${r.creatorUserId}`,
          pinAlert: pinAlertByRideId.get(r.rideId) ?? null,
        }))
      );

      setCreatedRides(
        allRides
          .filter((row) => Number(row.creator_user_id) === user.userId)
          .map((row) => {
            const rideId = Number(row.ID ?? row.id);
            return {
              rideId,
              title: String(row.title ?? ""),
              rideDate: String(row.ride_date ?? ""),
              status: String(row.status ?? "planned"),
              joinedCount: joinedCountByRide.get(rideId) ?? 0,
              maxRiders: Number(row.max_riders ?? 0),
            };
          })
      );
    } catch (err) {
      toast({
        title: "Couldn't load your rides",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingRides(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setInvitationRides([]);
      loadDashboardRides();
      return;
    }
    (async () => {
      await loadInvitations(user.userId);
      await loadDashboardRides();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const loadJoinRequests = async () => {
    if (!user) {
      setJoinRequests([]);
      return;
    }
    try {
      const { data: rideRows, error: rideError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 200,
        Filters: [{ name: "creator_user_id", op: "Equal", value: user.userId }],
      });
      if (rideError) throw new Error(rideError);
      const rideInfoById = new Map<number, { title: string; type: string }>();
      ((rideRows?.List ?? []) as Record<string, unknown>[]).forEach((r) =>
        rideInfoById.set(Number(r.ID ?? r.id), {
          title: String(r.title ?? ""),
          type: String(r.ride_type ?? "open"),
        })
      );
      if (rideInfoById.size === 0) {
        setJoinRequests([]);
        return;
      }

      const { data: requestRows, error: requestError } = await window.ezsite.apis.tablePage("ride_join_requests", {
        PageNo: 1,
        PageSize: 200,
        Filters: [{ name: "request_status", op: "Equal", value: "pending" }],
      });
      if (requestError) throw new Error(requestError);
      const pendingForMyRides = ((requestRows?.List ?? []) as Record<string, unknown>[]).filter((r) =>
        rideInfoById.has(Number(r.ride_id))
      );

      const connectedUserIds = new Set(await fetchConnectedUserIds(user.userId));
      const uniqueRequesterIds = Array.from(new Set(pendingForMyRides.map((r) => Number(r.requester_user_id))));
      const nameByUserId = new Map<number, string>();
      const attendancePctByUserId = new Map<number, number | null>();
      await Promise.all(
        uniqueRequesterIds.map(async (uid) => {
          const { data: profileData } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: uid }],
          });
          const profile = profileData?.List?.[0] as Record<string, unknown> | undefined;
          nameByUserId.set(uid, String(profile?.username || profile?.full_name || `Rider #${uid}`));

          const { data: attendanceData } = await window.ezsite.apis.tablePage("ride_participants", {
            PageNo: 1,
            PageSize: 500,
            Filters: [{ name: "user_id", op: "Equal", value: uid }],
          });
          const rows = (attendanceData?.List ?? []) as Record<string, unknown>[];
          const confirmed = rows.filter((r) => String(r.attended ?? "unconfirmed") !== "unconfirmed");
          const attended = confirmed.filter((r) => String(r.attended) === "yes");
          attendancePctByUserId.set(
            uid,
            confirmed.length > 0 ? Math.round((attended.length / confirmed.length) * 100) : null
          );
        })
      );

      const mapped: JoinRequestItem[] = pendingForMyRides.map((r) => {
        const requesterUserId = Number(r.requester_user_id);
        const rideId = Number(r.ride_id);
        return {
          rowId: Number(r.ID ?? r.id),
          rideId,
          rideTitle: rideInfoById.get(rideId)?.title ?? "",
          rideType: rideInfoById.get(rideId)?.type ?? "open",
          requesterUserId,
          requesterName: nameByUserId.get(requesterUserId) ?? `Rider #${requesterUserId}`,
          attendancePct: attendancePctByUserId.get(requesterUserId) ?? null,
          isConnected: connectedUserIds.has(requesterUserId),
        };
      });

      setJoinRequests(mapped);
    } catch (err) {
      toast({
        title: "Couldn't load join requests",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadJoinRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const loadStats = async () => {
    if (!user) {
      setParticipantStats({ ridesJoined: 0, confirmedRides: 0, attendanceRate: 0 });
      setOrganiserStats({ ridesOrganised: 0, avgAttendance: 0, expiredCount: 0 });
      return;
    }
    try {
      const { data: participantData, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        { PageNo: 1, PageSize: 1000, Filters: [{ name: "user_id", op: "Equal", value: user.userId }] }
      );
      if (participantError) throw new Error(participantError);
      const myParticipantRows = (participantData?.List ?? []) as Record<string, unknown>[];

      const ridesJoined = myParticipantRows.filter((r) =>
        ["joined", "accepted"].includes(String(r.join_status ?? ""))
      ).length;

      const confirmedRows = myParticipantRows.filter((r) =>
        ["attended", "not_attended"].includes(String(r.attended ?? ""))
      );
      const attendedRows = confirmedRows.filter((r) => String(r.attended) === "attended");
      const attendanceRate =
        confirmedRows.length > 0 ? Math.round((attendedRows.length / confirmedRows.length) * 100) : 0;

      setParticipantStats({ ridesJoined, confirmedRides: confirmedRows.length, attendanceRate });

      const [completedResult, expiredResult] = await Promise.all([
        window.ezsite.apis.tablePage("rides", {
          PageNo: 1,
          PageSize: 500,
          Filters: [
            { name: "creator_user_id", op: "Equal", value: user.userId },
            { name: "status", op: "Equal", value: "complete" },
          ],
        }),
        window.ezsite.apis.tablePage("rides", {
          PageNo: 1,
          PageSize: 500,
          Filters: [
            { name: "creator_user_id", op: "Equal", value: user.userId },
            { name: "status", op: "Equal", value: "expired" },
          ],
        }),
      ]);
      if (completedResult.error) throw new Error(completedResult.error);
      if (expiredResult.error) throw new Error(expiredResult.error);
      const expiredRows = (expiredResult.data?.List ?? []) as Record<string, unknown>[];
      const organisedRows = [
        ...((completedResult.data?.List ?? []) as Record<string, unknown>[]),
        ...expiredRows,
      ];

      let avgAttendance = 0;
      if (organisedRows.length > 0) {
        const rideRates = await Promise.all(
          organisedRows.map(async (row) => {
            const rideId = Number(row.ID ?? row.id);
            const { data: rideParticipantData } = await window.ezsite.apis.tablePage("ride_participants", {
              PageNo: 1,
              PageSize: 500,
              Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
            });
            const rows = (rideParticipantData?.List ?? []) as Record<string, unknown>[];
            const going = rows.filter((r) => ["joined", "accepted"].includes(String(r.join_status ?? "")));
            const attended = going.filter((r) => String(r.attended) === "attended");
            return going.length > 0 ? (attended.length / going.length) * 100 : 0;
          })
        );
        avgAttendance = Math.round(rideRates.reduce((sum, rate) => sum + rate, 0) / rideRates.length);
      }

      setOrganiserStats({ ridesOrganised: organisedRows.length, avgAttendance, expiredCount: expiredRows.length });
    } catch (err) {
      toast({
        title: "Couldn't load your stats",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const handleDropOut = async (ride: JoinedDashboardRide) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete("ride_participants", {
        ID: ride.participantRowId,
      });
      if (error) throw new Error(error);
      setJoinedRides((prev) => prev.filter((r) => r.participantRowId !== ride.participantRowId));
      toast({ title: "Dropped out", description: `You left "${ride.title}".` });
      notifyWaitlistOnSpotOpen(ride.rideId, ride.title).catch(() => {});
    } catch (err) {
      toast({
        title: "Couldn't drop out",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (request: JoinRequestItem) => {
    if (request.rideType === "private" && !request.isConnected) {
      toast({
        title: "Can't approve this request",
        description: "You can only add riders you're connected with to a private ride.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error: updateError } = await window.ezsite.apis.tableUpdate("ride_join_requests", {
        ID: request.rowId,
        request_status: "approved",
      });
      if (updateError) throw new Error(updateError);

      const { error: participantError } = await window.ezsite.apis.tableCreate("ride_participants", {
        ride_id: request.rideId,
        user_id: request.requesterUserId,
        join_status: "accepted",
        attended: "unconfirmed",
        joined_at: new Date().toISOString(),
      });
      if (participantError) throw new Error(participantError);

      const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
        user_id: request.requesterUserId,
        type: "join_approved",
        message: `You've been approved to join "${request.rideTitle}"`,
        related_ride_id: request.rideId,
        is_read: "no",
        created_at: new Date().toISOString(),
      });
      if (notifyError) throw new Error(notifyError);

      toast({ title: `${request.requesterName} approved`, description: `They were notified they're in.` });
      setJoinRequests((prev) => prev.filter((r) => r.rowId !== request.rowId));
    } catch (err) {
      toast({
        title: "Couldn't approve request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (request: JoinRequestItem) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate("ride_join_requests", {
        ID: request.rowId,
        request_status: "declined",
      });
      if (error) throw new Error(error);
      toast({ title: "Request declined" });
      setJoinRequests((prev) => prev.filter((r) => r.rowId !== request.rowId));
    } catch (err) {
      toast({
        title: "Couldn't decline request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <div className="flex flex-col gap-1 px-5 pb-2 pt-5">
        <h1 className="text-[20px] font-bold leading-snug text-[#F0F0F0]">
          Hey {(user?.fullName || user?.authName || "there").split(" ")[0]} 👋
        </h1>
        {user?.city && <p className="text-xs text-[#888888]">{user.city}</p>}
      </div>

      <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">My upcoming rides</h2>

        <div className="flex rounded-xl border border-[#333333] bg-[#222222] p-1">
          {(["joined", "created"] as RidesTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors",
                tab === t ? "bg-[#FF6600] text-white" : "text-[#888888] hover:text-[#F0F0F0]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loadingRides ? (
          <div className="flex flex-col gap-2.5">
            <RideCardSkeleton />
            <RideCardSkeleton />
          </div>
        ) : tab === "joined" ? (
          joinedRides.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#888888]">
              You haven't joined any upcoming rides.{" "}
              <button type="button" onClick={() => navigate("/discover")} className="font-semibold text-[#FF6600] active:underline">
                Explore rides →
              </button>
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {joinedRides.map((ride) => (
                <DashboardRideCard
                  key={ride.participantRowId}
                  title={ride.title}
                  rideDate={ride.rideDate}
                  creatorName={ride.creatorName}
                  pinAlert={ride.pinAlert}
                  onOpen={() => navigate(`/ride/${ride.rideId}`)}
                  onDropOut={() => handleDropOut(ride)}
                />
              ))}
            </div>
          )
        ) : createdRides.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#888888]">
            You haven't created any rides yet.{" "}
            <button type="button" onClick={() => navigate("/post")} className="font-semibold text-[#FF6600] active:underline">
              Post a ride →
            </button>
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {createdRides.map((ride) => (
              <CreatedRideCard
                key={ride.rideId}
                title={ride.title}
                rideDate={ride.rideDate}
                status={ride.status}
                joinedCount={ride.joinedCount}
                maxRiders={ride.maxRiders}
                onOpen={() => {
                  if (ride.status === "pending_confirmation") {
                    navigate(`/ride/${ride.rideId}/confirm-attendance`);
                  } else {
                    navigate(`/ride/${ride.rideId}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {joinRequests.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Join requests</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6600] px-1.5 text-[11px] font-bold text-white">
              {joinRequests.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {joinRequests.map((request) => (
              <JoinRequestRow
                key={request.rowId}
                riderName={request.requesterName}
                rideTitle={request.rideTitle}
                attendancePct={request.attendancePct}
                canApprove={!(request.rideType === "private" && !request.isConnected)}
                blockedMessage={
                  request.rideType === "private" && !request.isConnected
                    ? "You can only add riders you're connected with to a private ride."
                    : undefined
                }
                onApprove={() => handleApprove(request)}
                onDecline={() => handleDecline(request)}
              />
            ))}
          </div>
        </div>
      )}

      {invitationRides.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Invitations</h2>
          <div className="flex flex-col gap-2.5">
            {invitationRides.map((ride) => (
              <AttentionRow
                key={ride.rideId}
                title={ride.title}
                rideDate={ride.rideDate}
                onConfirm={() => navigate(`/ride/${ride.rideId}/confirm-attendance`)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">My stats</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <StatBox label="Rides joined" value={participantStats.ridesJoined} />

          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] px-3 py-4 text-center">
            <span className="text-lg font-bold text-[#F0F0F0]">
              {participantStats.confirmedRides < MIN_CONFIRMED_RIDES ? "—" : `${participantStats.attendanceRate}%`}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-[#888888]">Attendance rate</span>
            <AttendanceBadge
              attendanceRate={participantStats.attendanceRate}
              confirmedRides={participantStats.confirmedRides}
            />
          </div>

          {organiserStats.ridesOrganised === 0 ? (
            <StatBox
              label="Organiser"
              value=""
              muted
              mutedText="Organise a ride to build your organiser profile."
              className="col-span-2"
            />
          ) : (
            <>
              <StatBox label="Rides organised" value={organiserStats.ridesOrganised} />
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] px-3 py-4 text-center">
                <span className="text-lg font-bold text-[#F0F0F0]">{organiserStats.avgAttendance}%</span>
                <span className="text-[10px] uppercase tracking-wide text-[#888888]">Avg attendance</span>
                {(() => {
                  const badge = getOrganiserAttendanceBadge(
                    organiserStats.ridesOrganised,
                    organiserStats.avgAttendance
                  );
                  return badge ? (
                    <BadgePill
                      label={badge.label}
                      color={badge.color}
                      background={badge.background}
                      border={badge.border}
                      className="mt-0.5"
                    />
                  ) : null;
                })()}
              </div>
            </>
          )}
        </div>

        {invitationRides.length > 0 && (
          <p className="text-xs text-[#888888]">Confirm attendance to update your organiser stats.</p>
        )}

        {organiserStats.expiredCount > 0 && (
          <p className="text-xs text-[#888888]">
            You have {organiserStats.expiredCount} expired rides. Confirm attendance promptly to protect your
            organiser score.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Quick actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/post")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#FF6600] py-3.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
          >
            <PenLine className="h-4 w-4" />
            Post a ride
          </button>
          <button
            type="button"
            onClick={() => navigate("/riders")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#FF6600] py-3.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
          >
            <Users className="h-4 w-4" />
            Find riders
          </button>
          <button
            type="button"
            onClick={() => navigate("/clubs")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#FF6600] py-3.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
          >
            <Shield className="h-4 w-4" />
            Browse clubs
          </button>
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <button
          type="button"
          onClick={() => navigate("/admin-panel")}
          className="text-[10px] text-[#444444] transition-colors active:text-[#666666]"
        >
          Admin panel
        </button>
      </div>
    </div>
  );
};

export default RiderDashboardPage;
