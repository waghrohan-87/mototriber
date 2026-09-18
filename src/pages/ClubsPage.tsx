import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import FilterChips from "@/components/discover/FilterChips";
import DirectoryClubCard, { DirectoryClub } from "@/components/clubs/DirectoryClubCard";
import { BIKE_FOCUS_OPTIONS } from "@/components/club-registration/clubRegistrationTypes";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "@/hooks/use-toast";

const FILTERS = ["All", ...BIKE_FOCUS_OPTIONS];

interface ClubRow {
  id: number;
  name: string;
  city: string;
  bikeTypeFocus: string;
  logoUrl: string | null;
}

const ClubsPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<number, number>>({});
  const [membershipRowIds, setMembershipRowIds] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage("clubs", {
        PageNo: 1,
        PageSize: 200,
        OrderByField: "ID",
        IsAsc: false,
        Filters: [{ name: "status", op: "Equal", value: "approved" }],
      });
      if (error) throw new Error(error);
      const rows = ((data?.List ?? []) as Record<string, unknown>[]).map((row) => ({
        id: Number(row.ID ?? row.id),
        name: String(row.name ?? ""),
        city: String(row.city ?? ""),
        bikeTypeFocus: String(row.bike_type_focus ?? ""),
        logoUrl: (row.logo_url as string) || null,
      }));
      setClubs(rows);
    } catch (err) {
      toast({
        title: "Couldn't load clubs",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage("club_members", {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: "ID",
        IsAsc: false,
      });
      if (error) throw new Error(error);
      const rows = (data?.List ?? []) as Record<string, unknown>[];
      const counts: Record<number, number> = {};
      const mine: Record<number, number> = {};
      rows.forEach((row) => {
        const clubId = Number(row.club_id);
        counts[clubId] = (counts[clubId] ?? 0) + 1;
        if (user && Number(row.user_id) === user.userId) {
          mine[clubId] = Number(row.ID ?? row.id);
        }
      });
      setMemberCounts(counts);
      setMembershipRowIds(mine);
    } catch {
      // Keep previously loaded counts if the refresh fails.
    }
  };

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const visibleClubs: DirectoryClub[] = useMemo(() => {
    let result = clubs;
    if (activeFilter !== "All") result = result.filter((c) => c.bikeTypeFocus === activeFilter);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(query) || c.city.toLowerCase().includes(query)
      );
    }
    return result.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      bikeTypeFocus: c.bikeTypeFocus,
      logoUrl: c.logoUrl,
      memberCount: memberCounts[c.id] ?? 0,
      following: c.id in membershipRowIds,
    }));
  }, [clubs, activeFilter, search, memberCounts, membershipRowIds]);

  const handleToggleFollow = async (clubId: number) => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to follow clubs.", variant: "destructive" });
      return;
    }
    const rowId = membershipRowIds[clubId];
    try {
      if (rowId) {
        const { error } = await window.ezsite.apis.tableDelete("club_members", { ID: rowId });
        if (error) throw new Error(error);
      } else {
        const { error } = await window.ezsite.apis.tableCreate("club_members", {
          club_id: clubId,
          user_id: user.userId,
          role: "member",
          joined_at: new Date().toISOString(),
        });
        if (error) throw new Error(error);
      }
      await loadMembers();
    } catch (err) {
      toast({
        title: "Couldn't update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-[#333333] bg-[#222222] px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-[#666666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name or city..."
            className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
          />
        </div>
      </div>

      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={() => navigate("/register-club")}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FF6600] py-3 text-sm font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create a club
        </button>
      </div>

      <FilterChips filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      <div className="flex flex-col gap-3 px-4 pb-6 pt-1">
        {loading ? (
          <p className="py-10 text-center text-sm text-[#888888]">Loading clubs...</p>
        ) : visibleClubs.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#888888]">No clubs found.</p>
        ) : (
          visibleClubs.map((club) => (
            <DirectoryClubCard
              key={club.id}
              club={club}
              onToggleFollow={() => handleToggleFollow(club.id)}
              onOpen={() => navigate(`/club/${club.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ClubsPage;
