import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Star, UserRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useClubs } from "@/context/ClubsContext";
import { useRidersDirectory } from "@/context/RidersDirectoryContext";
import { useNotifications } from "@/context/NotificationsContext";
import { PROFILE } from "@/pages/ProfilePage";
import { getOrganiserBadge, OrganiserBadgeTier } from "@/lib/reputation";
import { Rider } from "@/components/riders/RiderCard";
import FilterChips from "@/components/discover/FilterChips";
import { Slider } from "@/components/ui/slider";
import OrganiserCard from "@/components/club-admin/OrganiserCard";

const BADGE_FILTERS = ["All", "Ride Leader", "Pack Master", "Legend"];

const FindOrganisersPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clubs } = useClubs();
  const { riders } = useRidersDirectory();
  const { notifications, sendCaptainInvite } = useNotifications();

  const club = useMemo(() => clubs.find((c) => c.id === id), [clubs, id]);

  const [cityFilter, setCityFilter] = useState(club?.city ?? "");
  const [badgeFilter, setBadgeFilter] = useState("All");
  const [minAttendance, setMinAttendance] = useState(75);

  const cities = useMemo(() => {
    const set = new Set(riders.map((r) => r.city));
    if (club) set.add(club.city);
    return Array.from(set);
  }, [riders, club]);

  const organisers = useMemo(() => {
    return riders
      .map((rider) => ({
        rider,
        badge: getOrganiserBadge(rider.ridesOrganised, rider.organiserAvgAttendance, rider.organiserAvgFillRate),
      }))
      .filter((entry): entry is { rider: Rider; badge: OrganiserBadgeTier } => Boolean(entry.badge))
      .filter((entry) => entry.rider.city === cityFilter)
      .filter((entry) => badgeFilter === "All" || entry.badge.label === badgeFilter)
      .filter((entry) => entry.rider.organiserAvgAttendance >= minAttendance)
      .sort(
        (a, b) =>
          b.rider.ridesOrganised * b.rider.organiserAvgAttendance -
          a.rider.ridesOrganised * a.rider.organiserAvgAttendance
      );
  }, [riders, cityFilter, badgeFilter, minAttendance]);

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">This club could not be found.</p>
        <button
          onClick={() => navigate("/clubs")}
          className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white"
        >
          Back to Clubs
        </button>
      </div>
    );
  }

  const viewerRider = riders.find((r) => r.handle === PROFILE.handle);
  const isAdmin = club.adminHandle === PROFILE.handle;
  const isCoAdmin = Boolean(viewerRider && club.coAdminIds.includes(viewerRider.id));

  if (!isAdmin && !isCoAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] px-8 text-center text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">
          Only the club admin or co-admins can find ride organisers for {club.name}.
        </p>
        <button
          onClick={() => navigate(`/club/${club.id}`)}
          className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white"
        >
          Back to club
        </button>
      </div>
    );
  }

  const handleInvite = (riderId: string, riderName: string) => {
    sendCaptainInvite(club.id, club.name, riderId, riderName);
    toast({
      title: "Invite sent",
      description: `${riderName} was invited to be a ride captain for ${club.name}.`,
    });
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
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center text-[#FF6600]">
            <UserRound className="h-5 w-5" />
            <Star className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#F0F0F0]">Find ride organisers</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 border-b border-[#2A2A2A] py-5">
            <div className="flex flex-col gap-1.5">
              <span className="px-5 text-xs font-bold uppercase tracking-wide text-[#888888]">City</span>
              <div className="-mx-1">
                <FilterChips filters={cities} active={cityFilter} onChange={setCityFilter} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="px-5 text-xs font-bold uppercase tracking-wide text-[#888888]">Badge</span>
              <div className="-mx-1">
                <FilterChips filters={BADGE_FILTERS} active={badgeFilter} onChange={setBadgeFilter} />
              </div>
            </div>
            <div className="flex flex-col gap-2 px-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-[#888888]">Min attendance rate</span>
                <span className="text-xs font-bold text-[#FF6600]">{minAttendance}%</span>
              </div>
              <Slider
                min={75}
                max={100}
                step={1}
                value={[minAttendance]}
                onValueChange={([value]) => setMinAttendance(value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-5">
            <span className="text-xs font-semibold text-[#888888]">
              {organisers.length} {organisers.length === 1 ? "organiser" : "organisers"} found
            </span>
            {organisers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#888888]">
                No organisers found in {cityFilter}. Try expanding your filters.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {organisers.map(({ rider, badge }) => (
                  <OrganiserCard
                    key={rider.id}
                    rider={rider}
                    badge={badge}
                    isCaptain={club.captainId === rider.id}
                    invitePending={notifications.some(
                      (n) => n.clubId === club.id && n.riderId === rider.id && n.status === "pending"
                    )}
                    onInvite={() => handleInvite(rider.id, rider.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FindOrganisersPage;
