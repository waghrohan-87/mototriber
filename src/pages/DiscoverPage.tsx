import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import FilterChips from "@/components/discover/FilterChips";
import RideCard, { Ride, RideType, SourcePlatform } from "@/components/discover/RideCard";
import RideCardSkeleton from "@/components/discover/RideCardSkeleton";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchConnectedUserIds } from "@/lib/connections";

const FILTERS = ["All rides", "Club rides", "Solo rides", "Open to all"];

type DiscoverRide = Ride & { clubId: number | null };

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [rides, setRides] = useState<DiscoverRide[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRides = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const userClubIds = new Set<number>();
      const connectedUserIds = new Set<number>();
      if (user) {
        const [memberRowsResult, connectedIds] = await Promise.all([
          window.ezsite.apis.tablePage("club_members", {
            PageNo: 1,
            PageSize: 200,
            Filters: [{ name: "user_id", op: "Equal", value: user.userId }],
          }),
          fetchConnectedUserIds(user.userId),
        ]);
        const { data: memberRows, error: memberError } = memberRowsResult;
        if (memberError) throw new Error(memberError);
        ((memberRows?.List ?? []) as Record<string, unknown>[]).forEach((row) =>
          userClubIds.add(Number(row.club_id))
        );
        connectedIds.forEach((id) => connectedUserIds.add(id));
      }

      const { data: rideRows, error: rideError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "ride_date",
        IsAsc: true,
        Filters: [{ name: "ride_date", op: "GreaterThanOrEqual", value: today }],
      });
      if (rideError) throw new Error(rideError);
      const upcoming = ((rideRows?.List ?? []) as Record<string, unknown>[]).filter((row) => {
        const status = String(row.status ?? "");
        const type = String(row.ride_type ?? "");
        if (!(status === "planned" || status === "live")) return false;
        if (type !== "private") return true;
        return connectedUserIds.has(Number(row.creator_user_id));
      });

      const { data: participantRows, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        { PageNo: 1, PageSize: 1000 }
      );
      if (participantError) throw new Error(participantError);
      const participants = (participantRows?.List ?? []) as Record<string, unknown>[];
      const joinedCountByRide = new Map<number, number>();
      const myParticipationByRide = new Map<number, boolean>();
      participants.forEach((row) => {
        const rideId = Number(row.ride_id);
        const status = String(row.join_status ?? "");
        if (status === "joined" || status === "accepted") {
          joinedCountByRide.set(rideId, (joinedCountByRide.get(rideId) ?? 0) + 1);
        }
        if (user && Number(row.user_id) === user.userId && (status === "joined" || status === "accepted")) {
          myParticipationByRide.set(rideId, true);
        }
      });

      const myPendingRequestRides = new Set<number>();
      if (user) {
        const { data: joinRequestRows, error: joinRequestError } = await window.ezsite.apis.tablePage(
          "ride_join_requests",
          {
            PageNo: 1,
            PageSize: 200,
            Filters: [{ name: "requester_user_id", op: "Equal", value: user.userId }],
          }
        );
        if (joinRequestError) throw new Error(joinRequestError);
        ((joinRequestRows?.List ?? []) as Record<string, unknown>[]).forEach((row) => {
          if (String(row.request_status ?? "") === "pending") {
            myPendingRequestRides.add(Number(row.ride_id));
          }
        });
      }

      const sourceByRideId = new Map<number, { platform: SourcePlatform; claimStatus: "unclaimed" | "claimed" }>();
      if (upcoming.length > 0) {
        const { data: sourceRows, error: sourceError } = await window.ezsite.apis.tablePage("ride_sources", {
          PageNo: 1,
          PageSize: 200,
          Filters: [{ name: "is_seeded", op: "Equal", value: "yes" }],
        });
        if (sourceError) throw new Error(sourceError);
        ((sourceRows?.List ?? []) as Record<string, unknown>[]).forEach((row) => {
          sourceByRideId.set(Number(row.ride_id), {
            platform: String(row.source_platform ?? "") as SourcePlatform,
            claimStatus: (String(row.claim_status ?? "unclaimed") as "unclaimed" | "claimed"),
          });
        });
      }

      const creatorIds = Array.from(new Set(upcoming.map((row) => Number(row.creator_user_id))));
      const creatorNames = new Map<number, string>();
      await Promise.all(
        creatorIds.map(async (creatorId) => {
          const { data: pData } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: creatorId }],
          });
          const fullName = String((pData?.List?.[0] as Record<string, unknown> | undefined)?.full_name ?? "");
          creatorNames.set(creatorId, fullName || `Rider #${creatorId}`);
        })
      );

      const mapped: DiscoverRide[] = upcoming.map((row) => {
        const id = Number(row.ID ?? row.id);
        const type = String(row.ride_type ?? "open") as RideType;
        const clubId = row.club_id != null ? Number(row.club_id) : null;
        const hasRecord = myParticipationByRide.has(id);
        const source = sourceByRideId.get(id);
        return {
          id: String(id),
          title: String(row.title ?? ""),
          type,
          date: String(row.ride_date ?? ""),
          time: String(row.ride_time ?? ""),
          distance: `${row.distance_km ?? 0} km`,
          meetingPoint: String(row.meeting_point ?? ""),
          poster: { name: creatorNames.get(Number(row.creator_user_id)) ?? "" },
          spotsTaken: joinedCountByRide.get(id) ?? 0,
          spotsTotal: Number(row.max_riders ?? 0),
          joined: hasRecord,
          requestOnly:
            (type === "club" && !userClubIds.has(clubId ?? -1) && !hasRecord) ||
            (type === "private" && !hasRecord),
          requested: myPendingRequestRides.has(id),
          clubId,
          isSeeded: Boolean(source),
          sourcePlatform: source?.platform,
          claimStatus: source?.claimStatus,
        };
      });

      setRides(mapped);
    } catch (err) {
      toast({
        title: "Couldn't load rides",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const handleRsvp = async (ride: DiscoverRide) => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to join a ride.", variant: "destructive" });
      return;
    }
    if (ride.joined || ride.requested) return;

    try {
      if (ride.requestOnly) {
        const { error } = await window.ezsite.apis.tableCreate("ride_join_requests", {
          ride_id: Number(ride.id),
          requester_user_id: user.userId,
          request_status: "pending",
          created_at: new Date().toISOString(),
        });
        if (error) throw new Error(error);
        toast({ title: "Request sent", description: `Your request to join "${ride.title}" was sent.` });
      } else {
        const { error } = await window.ezsite.apis.tableCreate("ride_participants", {
          ride_id: Number(ride.id),
          user_id: user.userId,
          join_status: "joined",
          attended: "unconfirmed",
          joined_at: new Date().toISOString(),
        });
        if (error) throw new Error(error);
        toast({ title: "You're in!", description: `You joined "${ride.title}".` });
      }
      await loadRides();
    } catch (err) {
      toast({
        title: "Couldn't join ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const visibleRides = useMemo(() => {
    if (activeFilter === "Club rides") return rides.filter((r) => r.type === "club");
    if (activeFilter === "Solo rides") return rides.filter((r) => r.type === "open" && r.clubId == null);
    if (activeFilter === "Open to all") return rides.filter((r) => r.type === "open");
    return rides;
  }, [activeFilter, rides]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <FilterChips filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        {loading ? (
          <>
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        ) : visibleRides.length === 0 ? (
          <button
            type="button"
            onClick={() => navigate("/post")}
            className="py-10 text-center text-sm text-[#888888] active:opacity-80"
          >
            No rides yet. <span className="font-semibold text-[#FF6600]">Post the first one →</span>
          </button>
        ) : (
          visibleRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onRsvp={() => handleRsvp(ride)}
              onOpen={() => navigate(`/ride/${ride.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
