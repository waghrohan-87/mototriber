import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, Check, Clock, ExternalLink, Gauge, Lock, MapPin, Pencil, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AVATAR_STYLES,
  BADGE_LABEL,
  BADGE_STYLES,
  RideType,
  SOURCE_PLATFORM_ICON,
  SourcePlatform,
  getInitials,
} from "@/components/discover/RideCard";
import { tintForName } from "@/lib/avatarTint";
import InviteRiderSheet from "@/components/discover/InviteRiderSheet";
import RideFormSheet, { RideFormValues } from "@/components/club-admin/RideFormSheet";
import RideReasonModal from "@/components/ride-detail/RideReasonModal";
import DropOutModal from "@/components/ride-detail/DropOutModal";
import DiscussionSection from "@/components/ride-detail/DiscussionSection";
import ClaimRideSheet from "@/components/ride-detail/ClaimRideSheet";
import { expirePendingRide, isPastConfirmationDeadline } from "@/lib/rideExpiry";
import { notifyWaitlistOnSpotOpen } from "@/lib/rideWaitlist";

interface RideDetail {
  id: number;
  title: string;
  type: RideType;
  date: string;
  time: string;
  distance: string;
  meetingPoint: string;
  description: string;
  bikeType: string;
  creatorUserId: number;
  creatorName: string;
  clubId: number | null;
  maxRiders: number;
  status: string;
  isSeeded: boolean;
  sourceRowId: number | null;
  sourcePlatform: SourcePlatform | null;
  sourceUrl: string;
  claimStatus: "unclaimed" | "claimed" | null;
  claimedByUserId: number | null;
  claimerName: string;
}

interface Participant {
  rowId: number;
  userId: number;
  name: string;
  joinStatus: string;
  joinedAt: string;
}

interface JoinRequest {
  rowId: number;
  requesterUserId: number;
  status: string;
}

const RideDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [ride, setRide] = useState<RideDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isClubMember, setIsClubMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [rideFormOpen, setRideFormOpen] = useState(false);
  const [claimSheetOpen, setClaimSheetOpen] = useState(false);
  const [reasonModalMode, setReasonModalMode] = useState<"edit" | "cancel" | null>(null);
  const [pendingEditReason, setPendingEditReason] = useState<string | null>(null);
  const [dropOutOpen, setDropOutOpen] = useState(false);

  const rideId = Number(id);

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

      const creatorUserId = Number(row.creator_user_id);
      const { data: creatorData } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: creatorUserId }],
      });
      const creatorProfile = creatorData?.List?.[0] as Record<string, unknown> | undefined;
      const creatorName = String(
        creatorProfile?.username || creatorProfile?.full_name || `Rider #${creatorUserId}`
      );

      const { data: participantRows, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        {
          PageNo: 1,
          PageSize: 500,
          Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
        }
      );
      if (participantError) throw new Error(participantError);
      const participantList = (participantRows?.List ?? []) as Record<string, unknown>[];

      const uniqueUserIds = Array.from(new Set(participantList.map((p) => Number(p.user_id))));
      const nameByUserId = new Map<number, string>();
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const { data } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: uid }],
          });
          const profileRow = data?.List?.[0] as Record<string, unknown> | undefined;
          const fullName = String(profileRow?.full_name ?? "").trim();
          const username = String(profileRow?.username ?? "").trim();
          const name = fullName || username || `Rider #${uid}`;
          nameByUserId.set(uid, name);
        })
      );

      const mappedParticipants: Participant[] = participantList.map((p) => ({
        rowId: Number(p.ID ?? p.id),
        userId: Number(p.user_id),
        name: nameByUserId.get(Number(p.user_id)) ?? `Rider #${p.user_id}`,
        joinStatus: String(p.join_status ?? ""),
        joinedAt: String(p.joined_at ?? ""),
      }));

      const { data: joinRequestRows, error: joinRequestError } = await window.ezsite.apis.tablePage(
        "ride_join_requests",
        {
          PageNo: 1,
          PageSize: 500,
          OrderByField: "ID",
          IsAsc: false,
          Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
        }
      );
      if (joinRequestError) throw new Error(joinRequestError);
      const mappedJoinRequests: JoinRequest[] = ((joinRequestRows?.List ?? []) as Record<string, unknown>[]).map(
        (r) => ({
          rowId: Number(r.ID ?? r.id),
          requesterUserId: Number(r.requester_user_id),
          status: String(r.request_status ?? "pending"),
        })
      );

      const clubId = row.club_id != null ? Number(row.club_id) : null;
      let clubMember = false;
      if (clubId != null && user) {
        const { data: memberData } = await window.ezsite.apis.tablePage("club_members", {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            { name: "club_id", op: "Equal", value: clubId },
            { name: "user_id", op: "Equal", value: user.userId },
          ],
        });
        clubMember = (memberData?.List?.length ?? 0) > 0;
      }

      let status = String(row.status ?? "planned");
      if (
        status === "pending_confirmation" &&
        isPastConfirmationDeadline(String(row.ride_date ?? ""), String(row.ride_time ?? ""))
      ) {
        const expired = await expirePendingRide(rideId);
        if (expired) status = "expired";
      }

      const { data: sourceRows, error: sourceError } = await window.ezsite.apis.tablePage("ride_sources", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
      });
      if (sourceError) throw new Error(sourceError);
      const sourceRow = sourceRows?.List?.[0] as Record<string, unknown> | undefined;
      const isSeeded = String(sourceRow?.is_seeded ?? "no") === "yes";
      const claimStatus = isSeeded
        ? (String(sourceRow?.claim_status ?? "unclaimed") as "unclaimed" | "claimed")
        : null;
      const claimedByUserId =
        sourceRow?.claimed_by_user_id != null ? Number(sourceRow.claimed_by_user_id) : null;

      let claimerName = "";
      if (isSeeded && claimStatus === "claimed" && claimedByUserId != null) {
        const { data: claimerData } = await window.ezsite.apis.tablePage("user_profiles", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "user_id", op: "Equal", value: claimedByUserId }],
        });
        const claimerProfile = claimerData?.List?.[0] as Record<string, unknown> | undefined;
        claimerName = String(
          claimerProfile?.username || claimerProfile?.full_name || `Rider #${claimedByUserId}`
        );
      }

      setRide({
        id: rideId,
        title: String(row.title ?? ""),
        type: String(row.ride_type ?? "open") as RideType,
        date: String(row.ride_date ?? ""),
        time: String(row.ride_time ?? ""),
        distance: `${row.distance_km ?? 0} km`,
        meetingPoint: String(row.meeting_point ?? ""),
        description: String(row.description ?? ""),
        bikeType: String(row.bike_type_welcome ?? ""),
        creatorUserId,
        creatorName,
        clubId,
        maxRiders: Number(row.max_riders ?? 0),
        status,
        isSeeded,
        sourceRowId: sourceRow ? Number(sourceRow.ID ?? sourceRow.id) : null,
        sourcePlatform: isSeeded ? (String(sourceRow?.source_platform ?? "") as SourcePlatform) : null,
        sourceUrl: String(sourceRow?.source_url ?? ""),
        claimStatus,
        claimedByUserId,
        claimerName,
      });
      setParticipants(mappedParticipants);
      setJoinRequests(mappedJoinRequests);
      setIsClubMember(clubMember);
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
  }, [rideId, user?.userId]);

  useEffect(() => {
    if (!rideId || !user) return;
    (async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage("ride_last_seen", {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            { name: "ride_id", op: "Equal", value: rideId },
            { name: "user_id", op: "Equal", value: user.userId },
          ],
        });
        if (error) throw new Error(error);
        const existing = data?.List?.[0] as Record<string, unknown> | undefined;
        const now = new Date().toISOString();
        if (existing) {
          const { error: updateError } = await window.ezsite.apis.tableUpdate("ride_last_seen", {
            ID: Number(existing.ID ?? existing.id),
            last_seen_at: now,
          });
          if (updateError) throw new Error(updateError);
        } else {
          const { error: createError } = await window.ezsite.apis.tableCreate("ride_last_seen", {
            ride_id: rideId,
            user_id: user.userId,
            last_seen_at: now,
          });
          if (createError) throw new Error(createError);
        }
      } catch {
        // Silent — not marking as seen doesn't block viewing the ride.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, user?.userId]);

  const joinedParticipants = useMemo(
    () => participants.filter((p) => p.joinStatus === "joined" || p.joinStatus === "accepted"),
    [participants]
  );
  const waitlistedParticipants = useMemo(
    () =>
      participants
        .filter((p) => p.joinStatus === "waitlisted")
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()),
    [participants]
  );
  const myParticipant = useMemo(
    () => (user ? participants.find((p) => p.userId === user.userId) : undefined),
    [participants, user]
  );
  const myWaitlistPosition = useMemo(() => {
    if (!user) return null;
    const index = waitlistedParticipants.findIndex((p) => p.userId === user.userId);
    return index >= 0 ? index + 1 : null;
  }, [waitlistedParticipants, user]);
  const myJoinRequest = useMemo(
    () => (user ? joinRequests.find((r) => r.requesterUserId === user.userId) : undefined),
    [joinRequests, user]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111]">
        <p className="text-sm text-[#888888]">Loading ride...</p>
      </div>
    );
  }

  if (!ride || notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">This ride could not be found.</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white"
        >
          Back to Discover
        </button>
      </div>
    );
  }

  const isPrivate = ride.type === "private";
  const isClub = ride.type === "club";
  const isCancelled = ride.status === "cancelled";
  const isExpired = ride.status === "expired";
  const isCreator = user != null && user.userId === ride.creatorUserId;
  const canDirectlyJoin = ride.type === "open" || (isClub && isClubMember);
  const isFull = ride.maxRiders > 0 && joinedParticipants.length >= ride.maxRiders;
  const spotsPct = ride.maxRiders > 0 ? Math.min(100, (joinedParticipants.length / ride.maxRiders) * 100) : 0;
  const isGoing = myParticipant?.joinStatus === "joined" || myParticipant?.joinStatus === "accepted";
  const pendingJoinRequest = myJoinRequest?.status === "pending";

  const isClaimed = ride.isSeeded && ride.claimStatus === "claimed";
  const displayOrganiserName = isClaimed && ride.claimerName ? ride.claimerName : ride.creatorName;
  const SourceIcon = ride.sourcePlatform ? SOURCE_PLATFORM_ICON[ride.sourcePlatform] : null;

  const canAccessDiscussion = isCreator || ride.type === "open" || (isClub && isClubMember) || (isPrivate && isGoing);

  const discussionLockedLabel = pendingJoinRequest
    ? "Request sent"
    : myParticipant?.joinStatus === "waitlisted"
    ? "On waitlist"
    : canDirectlyJoin
    ? "Join ride"
    : "Request to join";
  const discussionLockedDisabled = pendingJoinRequest || myParticipant?.joinStatus === "waitlisted" || actionBusy || isFull;

  const insertParticipant = async (joinStatus: string) => {
    if (!user) return;
    setActionBusy(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate("ride_participants", {
        ride_id: ride.id,
        user_id: user.userId,
        join_status: joinStatus,
        attended: "unconfirmed",
        joined_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);

      let waitlistPosition: number | null = null;
      if (joinStatus === "waitlisted") {
        const { data: waitlistData } = await window.ezsite.apis.tablePage("ride_participants", {
          PageNo: 1,
          PageSize: 500,
          OrderByField: "joined_at",
          IsAsc: true,
          Filters: [
            { name: "ride_id", op: "Equal", value: ride.id },
            { name: "join_status", op: "Equal", value: "waitlisted" },
          ],
        });
        const waitlistRows = (waitlistData?.List ?? []) as Record<string, unknown>[];
        const index = waitlistRows.findIndex((r) => Number(r.user_id) === user.userId);
        waitlistPosition = index >= 0 ? index + 1 : waitlistRows.length;
      }

      toast({
        title:
          joinStatus === "joined" ? "You're in!" : joinStatus === "waitlisted" ? "Added to waitlist" : "Request sent",
        description:
          joinStatus === "joined"
            ? `You joined "${ride.title}".`
            : joinStatus === "waitlisted"
            ? `You're #${waitlistPosition} on the waitlist for "${ride.title}". We'll notify you if a spot opens up.`
            : `The organiser will review your request for "${ride.title}".`,
      });
      await loadRide();
    } catch (err) {
      toast({
        title: "Couldn't join ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleClaimWaitlistSpot = async () => {
    if (!user || !myParticipant) return;
    setActionBusy(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage("ride_participants", {
        PageNo: 1,
        PageSize: 500,
        Filters: [{ name: "ride_id", op: "Equal", value: ride.id }],
      });
      if (error) throw new Error(error);
      const rows = (data?.List ?? []) as Record<string, unknown>[];
      const liveJoinedCount = rows.filter((r) =>
        ["joined", "accepted"].includes(String(r.join_status ?? ""))
      ).length;

      if (ride.maxRiders > 0 && liveJoinedCount >= ride.maxRiders) {
        toast({
          title: "Spot already taken",
          description: "Sorry, all open spots were just taken. You're still on the waitlist.",
        });
        await loadRide();
        return;
      }

      const { error: updateError } = await window.ezsite.apis.tableUpdate("ride_participants", {
        ID: myParticipant.rowId,
        join_status: "joined",
      });
      if (updateError) throw new Error(updateError);
      toast({ title: "You're in!", description: `You joined "${ride.title}".` });
      await loadRide();
    } catch (err) {
      toast({
        title: "Couldn't claim spot",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeave = async (reason: string) => {
    if (!myParticipant || !user) return;
    setActionBusy(true);
    try {
      const wasGoing = myParticipant.joinStatus === "joined" || myParticipant.joinStatus === "accepted";
      const { error } = await window.ezsite.apis.tableDelete("ride_participants", { ID: myParticipant.rowId });
      if (error) throw new Error(error);
      const riderName = user.username || user.fullName || user.authName;
      await insertPinnedComment(`${riderName} dropped out — ${reason}`, "dropout");
      setDropOutOpen(false);
      toast({ title: "Left the ride", description: `You left "${ride.title}".` });
      if (wasGoing) {
        notifyWaitlistOnSpotOpen(ride.id, ride.title).catch(() => {});
      }
      await loadRide();
    } catch (err) {
      toast({
        title: "Couldn't leave ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const createJoinRequest = async () => {
    if (!user) return;
    setActionBusy(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate("ride_join_requests", {
        ride_id: ride.id,
        requester_user_id: user.userId,
        request_status: "pending",
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      toast({ title: "Request sent", description: `The organiser will review your request for "${ride.title}".` });
      await loadRide();
    } catch (err) {
      toast({
        title: "Couldn't send request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleJoinClick = () => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to join a ride.", variant: "destructive" });
      return;
    }
    if (isFull) return;
    if (canDirectlyJoin) {
      insertParticipant("joined");
    } else {
      createJoinRequest();
    }
  };

  const handleWaitlistClick = () => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to join the waitlist.", variant: "destructive" });
      return;
    }
    insertParticipant("waitlisted");
  };

  const handleClaimRide = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to claim this ride.", variant: "destructive" });
      return;
    }
    if (!ride.sourceRowId) return;
    setActionBusy(true);
    try {
      const nowIso = new Date().toISOString();

      const { error: rideError } = await window.ezsite.apis.tableUpdate("rides", {
        ID: ride.id,
        creator_user_id: user.userId,
      });
      if (rideError) throw new Error(rideError);

      const { error: sourceError } = await window.ezsite.apis.tableUpdate("ride_sources", {
        ID: ride.sourceRowId,
        claim_status: "claimed",
        claimed_by_user_id: user.userId,
        claimed_at: nowIso,
      });
      if (sourceError) throw new Error(sourceError);

      if (!myParticipant) {
        const { error: participantError } = await window.ezsite.apis.tableCreate("ride_participants", {
          ride_id: ride.id,
          user_id: user.userId,
          join_status: "joined",
          attended: "unconfirmed",
          joined_at: nowIso,
        });
        if (participantError) throw new Error(participantError);
      }

      const claimerName = user.username || user.fullName || user.authName;
      await insertPinnedComment(
        `${claimerName} claimed this ride and is coordinating it. Originally spotted on ${ride.sourcePlatform}.`,
        "claim"
      );

      const { data: existingBadgeData, error: badgeCheckError } = await window.ezsite.apis.tablePage(
        "rider_badges_earned",
        {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            { name: "user_id", op: "Equal", value: user.userId },
            { name: "earned_for_ride_id", op: "Equal", value: ride.id },
            { name: "badge_name", op: "Equal", value: "Igniter" },
          ],
        }
      );
      if (badgeCheckError) throw new Error(badgeCheckError);
      if (!existingBadgeData?.List?.length) {
        const { error: badgeError } = await window.ezsite.apis.tableCreate("rider_badges_earned", {
          user_id: user.userId,
          badge_name: "Igniter",
          earned_for_ride_id: ride.id,
          earned_at: nowIso,
        });
        if (badgeError) throw new Error(badgeError);
      }

      await loadRide();
      setClaimSheetOpen(true);
    } catch (err) {
      toast({
        title: "Couldn't claim ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const insertPinnedComment = async (reason: string, pinType: "edit" | "cancel" | "claim" | "dropout") => {
    if (!user) return;
    const { error } = await window.ezsite.apis.tableCreate("ride_comments", {
      ride_id: ride.id,
      user_id: user.userId,
      comment_text: reason,
      is_pinned: "yes",
      pin_type: pinType,
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error);
  };

  const handleRideSubmit = async (values: RideFormValues) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate("rides", {
        ID: ride.id,
        title: values.title,
        ride_date: values.date,
        ride_time: values.time,
        distance_km: Number(values.distance.replace(/[^0-9.]/g, "")) || 0,
        meeting_point: values.meetingPoint,
        max_riders: Number(values.spotsTotal) || ride.maxRiders,
        description: values.description.trim(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      if (pendingEditReason) {
        await insertPinnedComment(pendingEditReason, "edit");
        setPendingEditReason(null);
      }
      toast({ title: "Ride updated" });
      setRideFormOpen(false);
      await loadRide();
    } catch (err) {
      toast({
        title: "Couldn't update ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReasonSubmit = async (reason: string) => {
    if (reasonModalMode === "edit") {
      setPendingEditReason(reason);
      setReasonModalMode(null);
      setRideFormOpen(true);
      return;
    }
    if (reasonModalMode === "cancel") {
      try {
        const { error } = await window.ezsite.apis.tableUpdate("rides", {
          ID: ride.id,
          status: "cancelled",
          updated_at: new Date().toISOString(),
        });
        if (error) throw new Error(error);
        await insertPinnedComment(reason, "cancel");
        toast({ title: "Ride cancelled", description: `"${ride.title}" was cancelled. Reason: ${reason}` });
        setReasonModalMode(null);
        await loadRide();
      } catch (err) {
        toast({
          title: "Couldn't cancel ride",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const rideForForm = {
    id: String(ride.id),
    title: ride.title,
    type: ride.type,
    date: ride.date,
    time: ride.time,
    distance: ride.distance,
    meetingPoint: ride.meetingPoint,
    poster: { name: ride.creatorName },
    spotsTaken: joinedParticipants.length,
    spotsTotal: ride.maxRiders,
    joined: Boolean(myParticipant),
    description: ride.description,
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
        </div>

        <div className="flex-1 overflow-y-auto">
          {isCancelled && (
            <div className="flex items-center gap-2 bg-[#DC2626] px-5 py-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-white" />
              <p className="text-sm font-bold text-white">This ride has been cancelled.</p>
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-2 bg-[#333333] px-5 py-3">
              <Clock className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
              <p className="text-sm font-bold text-[#AAAAAA]">Attendance was not confirmed for this ride.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[20px] font-bold leading-snug text-[#F0F0F0]">{ride.title}</h1>
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
              <span>{ride.meetingPoint}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: AVATAR_STYLES[ride.type].background,
                  color: AVATAR_STYLES[ride.type].color,
                }}
              >
                {getInitials(displayOrganiserName)}
              </span>
              <span className="text-xs text-[#AAAAAA]">
                Posted by <span className="font-semibold text-[#F0F0F0]">{displayOrganiserName}</span>
              </span>
            </div>
          </div>

          {(ride.description || ride.bikeType) && (
            <div className="flex flex-col gap-2 border-b border-[#2A2A2A] px-5 py-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">About this ride</h2>
              {ride.description && <p className="text-sm leading-relaxed text-[#AAAAAA]">{ride.description}</p>}
              {ride.bikeType && (
                <p className="text-xs text-[#888888]">
                  Bikes welcome: <span className="text-[#AAAAAA]">{ride.bikeType}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Spots</h2>

            {ride.maxRiders > 0 ? (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                  <div className="h-full rounded-full bg-[#FF6600] transition-all" style={{ width: `${spotsPct}%` }} />
                </div>
                <p className="text-xs text-[#888888]">
                  {joinedParticipants.length} of {ride.maxRiders} spots filled
                </p>
              </>
            ) : (
              <p className="text-xs text-[#888888]">Invite only &middot; no public spots</p>
            )}

            {joinedParticipants.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {joinedParticipants.map((p) => {
                  const tint = tintForName(p.name);
                  return (
                    <span
                      key={p.rowId}
                      title={p.name}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: tint.background, color: tint.color }}
                    >
                      {getInitials(p.name)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {waitlistedParticipants.length > 0 && (
            <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">
                Waitlist ({waitlistedParticipants.length})
              </h2>
              {isCreator ? (
                <div className="flex flex-col gap-2">
                  {waitlistedParticipants.map((p, index) => (
                    <div key={p.rowId} className="flex items-center gap-2 text-sm text-[#F0F0F0]">
                      <span className="text-xs font-bold text-[#888888]">#{index + 1}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {waitlistedParticipants.map((p) => {
                    const tint = tintForName(p.name);
                    return (
                      <span
                        key={p.rowId}
                        title={p.name}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold opacity-70"
                        style={{ backgroundColor: tint.background, color: tint.color }}
                      >
                        {getInitials(p.name)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {ride.isSeeded && ride.sourcePlatform && (
            <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
              {ride.claimStatus === "unclaimed" ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
                    {SourceIcon && <SourceIcon className="h-3.5 w-3.5 text-[#888888]" />}
                    <span>Originally spotted on {ride.sourcePlatform}</span>
                  </div>
                  {!isCreator && (
                    <p className="text-xs text-[#888888]">
                      This ride was shared by MotoTriber from a post on {ride.sourcePlatform}. Claim it to
                      coordinate — reach out to the original rider with your invite link and earn the Igniter
                      badge.
                    </p>
                  )}
                  {ride.sourceUrl && (
                    <a
                      href={ride.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] py-2.5 text-xs font-semibold text-[#F0F0F0] transition-colors active:border-[#FF6600]/50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open original post
                    </a>
                  )}
                  {!isCreator && !isCancelled && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={handleClaimRide}
                      className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,102,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
                    >
                      Claim &amp; coordinate this ride
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  {SourceIcon && <SourceIcon className="h-3.5 w-3.5 text-[#555555]" />}
                  <span>Originally spotted on {ride.sourcePlatform}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 border-b border-[#2A2A2A] px-5 py-5">
            {isCancelled ? null : isCreator ? (
              <>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="w-full rounded-xl border border-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                >
                  Invite a rider
                </button>
                <div className="flex items-center justify-center gap-6 pt-1">
                  <button
                    type="button"
                    onClick={() => setReasonModalMode("edit")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#AAAAAA] transition-colors active:text-[#F0F0F0]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit ride
                  </button>
                  <button
                    type="button"
                    onClick={() => setReasonModalMode("cancel")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] transition-colors active:text-[#DC2626]/80"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel ride
                  </button>
                </div>
              </>
            ) : ride.isSeeded && ride.claimStatus === "unclaimed" ? null : isGoing ? (
              <>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white"
                >
                  Going
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setDropOutOpen(true)}
                  className="w-full rounded-xl border border-[#555555] py-3 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  Leave ride
                </button>
              </>
            ) : pendingJoinRequest ? (
              <button
                type="button"
                disabled
                className="w-full rounded-xl border border-[#555555] py-3.5 text-sm font-bold text-[#AAAAAA]"
              >
                Request sent
              </button>
            ) : myParticipant?.joinStatus === "waitlisted" ? (
              isFull ? (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl border border-[#555555] py-3.5 text-sm font-bold text-[#AAAAAA]"
                  >
                    On waitlist
                  </button>
                  {myWaitlistPosition && (
                    <p className="text-xs text-[#888888]">You're #{myWaitlistPosition} on the waitlist</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleClaimWaitlistSpot}
                  className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,102,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  Claim your spot
                </button>
              )
            ) : isFull ? (
              <>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-[#2A2A2A] py-3.5 text-sm font-bold text-[#888888]"
                >
                  Ride full
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleWaitlistClick}
                  className="w-full rounded-xl border border-[#FF6600] py-3 text-xs font-bold text-[#FF6600] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  Join waitlist
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleJoinClick}
                  className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,102,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {canDirectlyJoin ? "Join ride" : "Request to join"}
                </button>
                {!canDirectlyJoin && (
                  <p className="text-xs text-[#888888]">
                    {isPrivate
                      ? "This is a private ride. Your request will be sent to the organiser for approval."
                      : "This is a club ride. Send a request and the organiser will approve you."}
                  </p>
                )}
              </>
            )}
          </div>

          <DiscussionSection
            rideId={ride.id}
            isCancelled={isCancelled}
            canAccess={canAccessDiscussion}
            currentUser={user}
            lockedLabel={discussionLockedLabel}
            lockedDisabled={discussionLockedDisabled}
            onRequestToJoin={handleJoinClick}
          />
        </div>
      </div>

      <InviteRiderSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        rideId={String(ride.id)}
        rideTitle={ride.title}
      />

      <ClaimRideSheet
        open={claimSheetOpen}
        onOpenChange={setClaimSheetOpen}
        rideId={ride.id}
        rideTitle={ride.title}
        sourceUrl={ride.sourceUrl}
      />

      <DropOutModal open={dropOutOpen} onOpenChange={setDropOutOpen} onConfirm={handleLeave} />

      {isCreator && (
        <>
          <RideFormSheet
            open={rideFormOpen}
            onOpenChange={(open) => {
              setRideFormOpen(open);
              if (!open) setPendingEditReason(null);
            }}
            ride={rideForForm}
            onSubmit={handleRideSubmit}
          />

          <RideReasonModal
            open={reasonModalMode !== null}
            onOpenChange={(open) => !open && setReasonModalMode(null)}
            mode={reasonModalMode ?? "edit"}
            onSubmit={handleReasonSubmit}
          />
        </>
      )}
    </motion.div>
  );
};

export default RideDetailPage;
