import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import RideSummaryCard, { RideSummary, RideVisibility } from "@/components/profile/RideSummaryCard";
import BikeTagPill from "@/components/shared/BikeTagPill";
import TopBar from "@/components/layout/TopBar";
import RidingInterestPills from "@/components/shared/RidingInterestPills";
import ReputationBlock from "@/components/shared/ReputationBlock";
import EditProfileSheet, { ProfileEditData } from "@/components/profile/EditProfileSheet";
import ConfirmDialog from "@/components/club-admin/ConfirmDialog";
import { RidingInterest } from "@/components/shared/ridingInterests";
import { getAttendanceTier, getOrganiserAttendanceBadge } from "@/lib/reputation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIgniterBadgeCount } from "@/hooks/useIgniterBadgeCount";
import { useUserClubs } from "@/hooks/useUserClubs";
import ClubMembershipList from "@/components/profile/ClubMembershipList";
import MyClubCard from "@/components/profile/MyClubCard";
import { getInitials } from "@/components/discover/RideCard";
import { fetchConnectionsCount } from "@/lib/connections";

// Kept for legacy mock-directory comparisons elsewhere in the app (RiderProfilePage,
// ClubAdminPage, FindOrganisersPage, ClubsContext) — not used to render this screen anymore.
export const PROFILE = {
  name: "Dev Robertson",
  handle: "@devrob",
  city: "Bangalore",
  avatarUrl: "https://i.pravatar.cc/200?img=52",
  bikes: ["RE Himalayan 450", "Adventure tourer"],
  totalRides: 38,
  attendanceRate: 95,
  ridesOrganised: 10,
  organiserAvgAttendance: 87,
  organiserAvgFillRate: 92,
};

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const EMPTY_PROFILE: ProfileEditData = {
  name: "",
  username: "",
  city: "",
  avatarUrl: "",
  bikes: [],
  bio: "",
};

interface ProfileStats {
  ridesJoined: number;
  confirmedRides: number;
  attendanceRate: number;
  kmRidden: number;
  ridesOrganised: number;
  avgAttendance: number;
}

const EMPTY_STATS: ProfileStats = {
  ridesJoined: 0,
  confirmedRides: 0,
  attendanceRate: 0,
  kmRidden: 0,
  ridesOrganised: 0,
  avgAttendance: 0,
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const igniterCount = useIgniterBadgeCount(user?.userId);
  const [clubsExpanded, setClubsExpanded] = useState(false);
  const { clubs: myClubs, loading: myClubsLoading } = useUserClubs(user?.userId, true);

  const [profileRowId, setProfileRowId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileEditData>(EMPTY_PROFILE);
  const [interests, setInterests] = useState<RidingInterest[]>([]);
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);
  const [myRides, setMyRides] = useState<RideSummary[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const loadProfile = async () => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const { data: profileData, error: profileError } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: user.userId }],
      });
      if (profileError) throw new Error(profileError);
      const row = profileData?.List?.[0] as Record<string, unknown> | undefined;

      setProfileRowId(row ? Number(row.ID ?? row.id) : null);
      setProfile({
        name: String(row?.full_name || user.fullName || user.authName || ""),
        username: `@${String(row?.username || user.username || "")}`,
        city: String(row?.city || ""),
        avatarUrl: String(row?.profile_photo_url || ""),
        bikes: parseStringArray(row?.bikes_owned),
        bio: String(row?.bio || ""),
      });
      setInterests(parseStringArray(row?.riding_interests) as RidingInterest[]);

      const { data: participantData, error: participantError } = await window.ezsite.apis.tablePage(
        "ride_participants",
        { PageNo: 1, PageSize: 1000, Filters: [{ name: "user_id", op: "Equal", value: user.userId }] }
      );
      if (participantError) throw new Error(participantError);
      const myParticipantRows = (participantData?.List ?? []) as Record<string, unknown>[];

      const joinedRows = myParticipantRows.filter((r) => ["joined", "accepted"].includes(String(r.join_status ?? "")));
      const ridesJoined = joinedRows.length;
      const joinedRideIds = Array.from(new Set(joinedRows.map((r) => Number(r.ride_id))));

      const confirmedRows = myParticipantRows.filter((r) =>
        ["attended", "not_attended"].includes(String(r.attended ?? ""))
      );
      const attendedRows = confirmedRows.filter((r) => String(r.attended) === "attended");
      const attendanceRate =
        confirmedRows.length > 0 ? Math.round((attendedRows.length / confirmedRows.length) * 100) : 0;
      const attendedRideIds = new Set(attendedRows.map((r) => Number(r.ride_id)));

      const { data: createdData, error: createdError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 500,
        Filters: [{ name: "creator_user_id", op: "Equal", value: user.userId }],
      });
      if (createdError) throw new Error(createdError);
      const createdRows = (createdData?.List ?? []) as Record<string, unknown>[];
      const createdRideIds = new Set(createdRows.map((r) => Number(r.ID ?? r.id)));

      const joinedOnlyIds = joinedRideIds.filter((id) => !createdRideIds.has(id));
      const joinedOnlyResults = await Promise.all(
        joinedOnlyIds.map((rideId) =>
          window.ezsite.apis.tablePage("rides", { PageNo: 1, PageSize: 1, Filters: [{ name: "ID", op: "Equal", value: rideId }] })
        )
      );
      const joinedOnlyRows = joinedOnlyResults
        .map((res) => res.data?.List?.[0] as Record<string, unknown> | undefined)
        .filter((row): row is Record<string, unknown> => Boolean(row));

      const rideById = new Map<number, Record<string, unknown>>();
      [...createdRows, ...joinedOnlyRows].forEach((row) => rideById.set(Number(row.ID ?? row.id), row));

      const kmRidden = Array.from(attendedRideIds).reduce((sum, rideId) => {
        const row = rideById.get(rideId);
        return sum + (row ? Number(row.distance_km ?? 0) : 0);
      }, 0);

      const organisedRows = createdRows.filter((r) => ["complete", "expired"].includes(String(r.status ?? "")));
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

      setStats({
        ridesJoined,
        confirmedRides: confirmedRows.length,
        attendanceRate,
        kmRidden,
        ridesOrganised: organisedRows.length,
        avgAttendance,
      });

      const displayRides: RideSummary[] = Array.from(rideById.values())
        .sort((a, b) => new Date(String(b.ride_date ?? 0)).getTime() - new Date(String(a.ride_date ?? 0)).getTime())
        .slice(0, 10)
        .map((row) => {
          const rideDate = String(row.ride_date ?? "");
          let formattedDate = rideDate;
          try {
            formattedDate = rideDate ? format(new Date(rideDate), "EEE, MMM d") : "";
          } catch {
            formattedDate = rideDate;
          }
          return {
            id: String(row.ID ?? row.id),
            title: String(row.title ?? ""),
            date: formattedDate,
            distance: `${row.distance_km ?? 0} km`,
            visibility: (String(row.visibility ?? "public") as RideVisibility),
          };
        });
      setMyRides(displayRides);

      setConnectionsCount(await fetchConnectionsCount(user.userId));
    } catch (err) {
      toast({
        title: "Couldn't load your profile",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const participationTier = getAttendanceTier(stats.attendanceRate, stats.confirmedRides);
  const organiserBadge = getOrganiserAttendanceBadge(stats.ridesOrganised, stats.avgAttendance);

  const statTiles = [
    { label: "Rides", value: String(stats.ridesJoined) },
    { label: "km ridden", value: stats.kmRidden.toLocaleString() },
    { label: "Clubs", value: String(myClubs.length) },
    { label: "Connections", value: connectionsCount.toLocaleString() },
  ];

  const handleSaveProfile = async (nextProfile: ProfileEditData, nextInterests: RidingInterest[]) => {
    if (!user) return;
    const payload = {
      full_name: nextProfile.name,
      username: nextProfile.username.replace(/^@/, "").trim(),
      city: nextProfile.city,
      profile_photo_url: nextProfile.avatarUrl || null,
      bikes_owned: nextProfile.bikes,
      riding_interests: nextInterests,
      bio: nextProfile.bio,
    };
    try {
      const { error } = profileRowId
        ? await window.ezsite.apis.tableUpdate("user_profiles", { ID: profileRowId, ...payload })
        : await window.ezsite.apis.tableCreate("user_profiles", {
            user_id: user.userId,
            ...payload,
            account_status: "active",
            last_login: new Date().toISOString(),
          });
      if (error) throw new Error(error);
      setProfile(nextProfile);
      setInterests(nextInterests);
      toast({ title: "Profile updated" });
      loadProfile();
    } catch (err) {
      toast({
        title: "Couldn't update profile",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await window.ezsite.apis.logout();
      if (error) throw new Error(error);
    } catch (err) {
      toast({
        title: "Couldn't log out",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      return;
    } finally {
      setLogoutConfirmOpen(false);
    }
    navigate("/login");
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar />
        <p className="py-10 text-center text-sm text-[#888888]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        right={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit profile"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#888888] transition-colors active:bg-[#222222]"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />
      <div className="bg-gradient-to-b from-[#2A1608] via-[#1a1a1a] to-[#141414] px-5 pb-6 pt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-16 w-16 rounded-full border-2 border-[#FF6600] object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FF6600] bg-[#2A2A2A] text-base font-bold text-[#F0F0F0]">
              {getInitials(profile.name || "?")}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-[#F0F0F0]">{profile.name}</h1>
            <p className="text-xs text-[#888888]">
              {profile.username} &middot; {profile.city}
            </p>
          </div>
          {profile.bio && <p className="max-w-xs text-xs text-[#AAAAAA]">{profile.bio}</p>}
          <ReputationBlock
            participationTier={participationTier}
            organiserBadge={organiserBadge}
            igniterCount={igniterCount}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {profile.bikes.map((bike) => (
              <BikeTagPill key={bike} label={bike} />
            ))}
          </div>
          <RidingInterestPills interests={interests} />
        </div>
      </div>

      <div className="border-b border-[#333333] px-4 py-5">
        <div className="grid grid-cols-4 gap-2">
          {statTiles.map((stat) =>
            stat.label === "Clubs" ? (
              <button
                key={stat.label}
                type="button"
                onClick={() => setClubsExpanded((prev) => !prev)}
                className="flex flex-col items-center gap-1 rounded-lg py-0.5 transition-colors active:bg-[#1a1a1a]"
              >
                <span className="text-lg font-bold text-[#F0F0F0]">{stat.value}</span>
                <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">
                  {stat.label}
                </span>
              </button>
            ) : (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold text-[#F0F0F0]">{stat.value}</span>
                <span className="text-center text-[10px] uppercase tracking-wide text-[#888888]">
                  {stat.label}
                </span>
              </div>
            )
          )}
        </div>

        {clubsExpanded && (
          <div className="mt-4">
            <ClubMembershipList clubs={myClubs} loading={myClubsLoading} />
          </div>
        )}
      </div>

      <MyClubCard userId={user?.userId} />

      <div className="flex flex-col gap-3 px-4 pb-6 pt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Your rides</h2>
        {myRides.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#888888]">No rides yet — join or post one to get started.</p>
        ) : (
          myRides.map((ride) => <RideSummaryCard key={ride.id} ride={ride} />)
        )}
      </div>

      <div className="flex justify-center pb-8 pt-2">
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className="text-sm font-semibold text-[#EF4444] transition-colors active:text-[#EF4444]/80"
        >
          Log out
        </button>
      </div>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        interests={interests}
        onSave={handleSaveProfile}
      />

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="You will need to sign in again to access MotoTriber."
        confirmLabel="Log out"
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default ProfilePage;
