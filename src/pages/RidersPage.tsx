import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import FilterChips from "@/components/discover/FilterChips";
import RiderCard, { RiderCardData } from "@/components/riders/RiderCard";
import RiderCardSkeleton from "@/components/riders/RiderCardSkeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { avatarTintForName } from "@/lib/avatarTint";
import { MIN_CONFIRMED_RIDES } from "@/lib/reputation";
import { RIDING_INTERESTS, RidingInterest } from "@/components/shared/ridingInterests";
import { toast } from "@/hooks/use-toast";
import {
  ConnectionRecord,
  acceptConnectionRequest,
  declineConnectionRequest,
  fetchConnectionsForUser,
  formatRiderLabel,
  latestConnectionMap,
  resolveConnectionState,
  sendConnectRequest,
} from "@/lib/connections";
import { findOrCreateConversation } from "@/lib/messaging";

interface RiderListItem extends RiderCardData {
  userId: number;
  ridingInterests: RidingInterest[];
}

const FILTERS: string[] = ["All", ...RIDING_INTERESTS];

const RidersPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[0]);
  const [riders, setRiders] = useState<RiderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionsMap, setConnectionsMap] = useState<Map<number, ConnectionRecord>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadRiders = async () => {
      setLoading(true);
      try {
        const { data: profilesData, error: profilesError } = await window.ezsite.apis.tablePage("user_profiles", {
          PageNo: 1,
          PageSize: 500,
          OrderByField: "ID",
          IsAsc: false,
        });
        if (profilesError) throw new Error(profilesError);
        const profileRows = ((profilesData?.List ?? []) as Record<string, unknown>[]).filter(
          (row) => Number(row.user_id) !== user.userId
        );

        const { data: participantsData, error: participantsError } = await window.ezsite.apis.tablePage(
          "ride_participants",
          { PageNo: 1, PageSize: 5000 }
        );
        if (participantsError) throw new Error(participantsError);
        const participantRows = (participantsData?.List ?? []) as Record<string, unknown>[];

        const attendanceByUser = new Map<number, { confirmed: number; attended: number }>();
        participantRows.forEach((row) => {
          if (!["attended", "not_attended"].includes(String(row.attended ?? ""))) return;
          const rowUserId = Number(row.user_id);
          const entry = attendanceByUser.get(rowUserId) ?? { confirmed: 0, attended: 0 };
          entry.confirmed += 1;
          if (String(row.attended) === "attended") entry.attended += 1;
          attendanceByUser.set(rowUserId, entry);
        });

        const nextRiders: RiderListItem[] = profileRows.map((row) => {
          const rowUserId = Number(row.user_id);
          const name = String(row.full_name || row.username || "Rider");
          const username = String(row.username || "");
          const bikes = Array.isArray(row.bikes_owned) ? (row.bikes_owned as string[]) : [];
          const ridingInterests = Array.isArray(row.riding_interests)
            ? (row.riding_interests as RidingInterest[])
            : [];
          const stats = attendanceByUser.get(rowUserId);
          const attendanceRate =
            stats && stats.confirmed >= MIN_CONFIRMED_RIDES
              ? Math.round((stats.attended / stats.confirmed) * 100)
              : null;

          return {
            id: String(rowUserId),
            userId: rowUserId,
            name,
            handle: username ? `@${username}` : "@rider",
            city: String(row.city || ""),
            avatarTint: avatarTintForName(name),
            bikes,
            ridingInterests,
            attendanceRate,
            connected: false,
          };
        });

        if (!cancelled) setRiders(nextRiders);
      } catch (err) {
        if (!cancelled) {
          setRiders([]);
          toast({
            title: "Couldn't load riders",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRiders();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const loadConnections = useCallback(async () => {
    if (!user) return;
    try {
      const records = await fetchConnectionsForUser(user.userId);
      setConnectionsMap(latestConnectionMap(records, user.userId));
    } catch {
      setConnectionsMap(new Map());
    }
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const setPending = (id: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleConnect = async (targetUserId: number) => {
    if (!user) return;
    setPending(targetUserId, true);
    try {
      await sendConnectRequest(user.userId, formatRiderLabel(user.username, user.fullName), targetUserId);
      await loadConnections();
    } catch (err) {
      toast({
        title: "Couldn't send request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(targetUserId, false);
    }
  };

  const handleAccept = async (record: ConnectionRecord) => {
    if (!user) return;
    setPending(record.requesterUserId, true);
    try {
      await acceptConnectionRequest(record, formatRiderLabel(user.username, user.fullName));
      await loadConnections();
      toast({ title: "Connection accepted" });
    } catch (err) {
      toast({
        title: "Couldn't accept request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(record.requesterUserId, false);
    }
  };

  const handleDecline = async (record: ConnectionRecord) => {
    setPending(record.requesterUserId, true);
    try {
      await declineConnectionRequest(record);
      await loadConnections();
    } catch (err) {
      toast({
        title: "Couldn't decline request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(record.requesterUserId, false);
    }
  };

  const handleMessage = async (targetUserId: number) => {
    if (!user) return;
    try {
      const conversation = await findOrCreateConversation(user.userId, targetUserId);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast({
        title: "Couldn't open conversation",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const visibleRiders = useMemo(() => {
    let result = riders;

    if (activeFilter !== "All") {
      result = result.filter((rider) => rider.ridingInterests.includes(activeFilter as RidingInterest));
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (rider) =>
          rider.name.toLowerCase().includes(query) ||
          rider.handle.toLowerCase().includes(query) ||
          rider.city.toLowerCase().includes(query)
      );
    }

    return result;
  }, [riders, activeFilter, search]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-[#666666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or city..."
            className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
          />
        </div>
      </div>

      <FilterChips filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      <div className="flex flex-col gap-2 px-4 pb-6 pt-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <RiderCardSkeleton key={index} />)
        ) : riders.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#888888]">
            No riders yet. Invite friends to join MotoTriber.
          </p>
        ) : visibleRiders.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#888888]">No riders found.</p>
        ) : (
          visibleRiders.map((rider) => {
            const record = connectionsMap.get(rider.userId);
            const connectionState = user ? resolveConnectionState(user.userId, record) : "connect";
            return (
              <RiderCard
                key={rider.id}
                rider={rider}
                onOpen={() => navigate(`/rider/${rider.id}`)}
                connectionState={connectionState}
                actionPending={pendingIds.has(rider.userId)}
                onConnect={() => handleConnect(rider.userId)}
                onAccept={() => record && handleAccept(record)}
                onDecline={() => record && handleDecline(record)}
                onMessage={() => handleMessage(rider.userId)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default RidersPage;
