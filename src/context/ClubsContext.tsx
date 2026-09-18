import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef } from "react";
import { Club } from "@/components/clubs/ClubCard";
import { PROFILE } from "@/pages/ProfilePage";
import { normalizeHandle } from "@/components/club-registration/isRegisteredHandle";
import {
  ClubApplication,
  ClubApplicationStatus,
  bikeFocusLabel,
  bikeFocusToCategory,
} from "@/components/club-registration/clubApplicationTypes";

export const INITIAL_CLUBS: Club[] = [
  {
    id: "1",
    name: "Royal Riders Bangalore",
    bikeType: "Royal Enfield",
    city: "Bangalore",
    category: "RE clubs",
    avatarUrl: "https://i.pravatar.cc/100?img=15",
    members: 2840,
    ridesPerYear: 36,
    following: true,
    description:
      "Bangalore's largest Royal Enfield community. Weekend breakfast runs, monthly long tours, and a strong focus on riding etiquette.",
    verified: true,
    ridesOrganised: 36,
    avgAttendanceRate: 91,
    whatsappNumber: "+919876543210",
    instagramHandle: "royalriders_blr",
    websiteUrl: "https://royalridersblr.com",
    memberIds: ["1", "2", "3", "4"],
    captainId: "1",
    coAdminIds: [],
    pendingRequestIds: [],
    announcements: [],
    active: true,
    adminHandle: "@rrb_admin",
    membershipStatus: "member",
  },
  {
    id: "2",
    name: "Deccan Adventure Collective",
    bikeType: "Adventure & Dual-Sport",
    city: "Bangalore",
    category: "Adventure",
    avatarUrl: "https://i.pravatar.cc/100?img=22",
    members: 1120,
    ridesPerYear: 24,
    following: false,
    description:
      "Off-road and dual-sport riders exploring the trails around the Deccan plateau. New riders welcome on beginner-friendly rides.",
    verified: false,
    ridesOrganised: 24,
    avgAttendanceRate: 78,
    facebookUrl: "https://facebook.com/deccanadv",
    instagramHandle: "deccan_adv",
    memberIds: ["5", "6"],
    coAdminIds: [],
    pendingRequestIds: ["1", "7"],
    announcements: [
      {
        id: "a1",
        text: "Off-road Trail Day this Saturday — meet at the usual spot, 6:30 AM sharp. Bring your own hydration.",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "a2",
        text: "Welcome to all the new members who joined this month! Introduce yourself in the group.",
        createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    active: true,
    adminHandle: "@devrob",
    membershipStatus: "member",
  },
  {
    id: "3",
    name: "SheRides Bangalore",
    bikeType: "All bikes",
    city: "Bangalore",
    category: "Women",
    avatarUrl: "https://i.pravatar.cc/100?img=31",
    members: 640,
    ridesPerYear: 18,
    following: false,
    description:
      "A community for women riders of all skill levels. Monthly meetups, skill workshops, and safe group rides across Bangalore.",
    verified: true,
    ridesOrganised: 18,
    avgAttendanceRate: 95,
    whatsappNumber: "+919812345678",
    instagramHandle: "sherides_blr",
    websiteUrl: "https://sherides.in",
    memberIds: ["2", "7"],
    captainId: "2",
    coAdminIds: [],
    pendingRequestIds: [],
    announcements: [],
    active: true,
    adminHandle: "@sheridesadmin",
    membershipStatus: "pending",
  },
  {
    id: "4",
    name: "Apex Sportbike Club",
    bikeType: "Sportbikes",
    city: "Bangalore",
    category: "Sports",
    avatarUrl: "https://i.pravatar.cc/100?img=8",
    members: 980,
    ridesPerYear: 30,
    following: true,
    description:
      "Track days, canyon carving, and sportbike meets. Riders push their limits safely with experienced marshals on every ride.",
    verified: false,
    ridesOrganised: 30,
    avgAttendanceRate: 82,
    facebookUrl: "https://facebook.com/apexsportbike",
    websiteUrl: "https://apexsportbike.club",
    memberIds: ["3", "4", "5", "6", "7"],
    captainId: "3",
    coAdminIds: [],
    pendingRequestIds: [],
    announcements: [],
    active: true,
    adminHandle: "@apexadmin",
    membershipStatus: "none",
  },
];

const mapRow = (row: Record<string, unknown>): ClubApplication => ({
  id: Number(row.ID ?? row.id),
  club_name: String(row.club_name ?? ""),
  city: String(row.city ?? ""),
  year_founded: row.year_founded ? Number(row.year_founded) : null,
  bike_focus: (row.bike_focus as ClubApplication["bike_focus"]) ?? "",
  description: String(row.description ?? ""),
  logo_file_id: row.logo_file_id ? Number(row.logo_file_id) : null,
  whatsapp_number: String(row.whatsapp_number ?? ""),
  instagram_handle: String(row.instagram_handle ?? ""),
  facebook_url: String(row.facebook_url ?? ""),
  youtube_url: String(row.youtube_url ?? ""),
  website_url: String(row.website_url ?? ""),
  admin_name: String(row.admin_name ?? ""),
  admin_phone: String(row.admin_phone ?? ""),
  admin_email: String(row.admin_email ?? ""),
  admin_username: String(row.admin_username ?? ""),
  has_ride_captain: Boolean(row.has_ride_captain),
  ride_captain_username: String(row.ride_captain_username ?? ""),
  status: (row.status as ClubApplicationStatus) ?? "pending",
  submitted_at: String(row.submitted_at ?? ""),
});

interface ClubsContextValue {
  clubs: Club[];
  toggleFollow: (id: string) => void;
  requestToJoin: (id: string) => void;
  approveJoinRequest: (clubId: string, riderId: string) => void;
  declineJoinRequest: (clubId: string, riderId: string) => void;
  removeMember: (clubId: string, riderId: string) => void;
  makeCoAdmin: (clubId: string, riderId: string) => void;
  assignCaptain: (clubId: string, riderId: string) => void;
  transferAdmin: (clubId: string, adminHandle: string) => void;
  postAnnouncement: (clubId: string, text: string) => void;
  updateClubSettings: (clubId: string, patch: Partial<Club>) => void;
  deactivateClub: (clubId: string) => void;
  applications: ClubApplication[];
  applicationsLoading: boolean;
  pendingApplications: ClubApplication[];
  myApplication: ClubApplication | null;
  refreshApplications: () => Promise<void>;
  approveApplication: (id: number) => Promise<void>;
  rejectApplication: (id: number) => Promise<void>;
}

const ClubsContext = createContext<ClubsContextValue | undefined>(undefined);

export const ClubsProvider = ({ children }: { children: ReactNode }) => {
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [applications, setApplications] = useState<ClubApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const syncedClubIds = useRef(new Set<string>());

  const refreshApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage("club_applications", {
        PageNo: 1,
        PageSize: 200,
        OrderByField: "ID",
        IsAsc: false,
      });
      if (error) throw new Error(error);
      setApplications(((data?.List ?? []) as Record<string, unknown>[]).map(mapRow));
    } catch {
      // Keep the previously loaded applications if the refresh fails.
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  // Approved club applications become live clubs in the directory.
  useEffect(() => {
    const toAdd = applications.filter(
      (a) => a.status === "approved" && !syncedClubIds.current.has(`app-${a.id}`)
    );
    if (toAdd.length === 0) return;

    let cancelled = false;
    (async () => {
      const newClubs: Club[] = [];
      for (const app of toAdd) {
        syncedClubIds.current.add(`app-${app.id}`);
        let avatarUrl = `https://i.pravatar.cc/100?img=${(app.id % 70) + 1}`;
        if (app.logo_file_id) {
          try {
            const { data } = await window.ezsite.apis.getUploadUrl(app.logo_file_id);
            if (data) avatarUrl = data as string;
          } catch {
            // Fall back to the placeholder avatar.
          }
        }
        newClubs.push({
          id: `app-${app.id}`,
          name: app.club_name,
          bikeType: bikeFocusLabel(app.bike_focus),
          city: app.city,
          category: bikeFocusToCategory(app.bike_focus),
          avatarUrl,
          members: 0,
          ridesPerYear: 0,
          following: false,
          description: app.description,
          verified: false,
          ridesOrganised: 0,
          avgAttendanceRate: 0,
          whatsappNumber: app.whatsapp_number || undefined,
          instagramHandle: app.instagram_handle || undefined,
          facebookUrl: app.facebook_url || undefined,
          websiteUrl: app.website_url || undefined,
          memberIds: [],
          coAdminIds: [],
          pendingRequestIds: [],
          announcements: [],
          active: true,
          adminHandle: app.admin_username,
          membershipStatus: "none",
        });
      }
      if (!cancelled && newClubs.length > 0) {
        setClubs((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const filtered = newClubs.filter((c) => !existingIds.has(c.id));
          return filtered.length ? [...prev, ...filtered] : prev;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applications]);

  const pendingApplications = useMemo(
    () => applications.filter((a) => a.status === "pending"),
    [applications]
  );

  const myApplication = useMemo(() => {
    const mine = applications.filter(
      (a) => normalizeHandle(a.admin_username) === normalizeHandle(PROFILE.handle)
    );
    if (mine.length === 0) return null;
    return mine.reduce((latest, a) =>
      new Date(a.submitted_at).getTime() > new Date(latest.submitted_at).getTime() ? a : latest
    );
  }, [applications]);

  const approveApplication = async (id: number) => {
    const { error } = await window.ezsite.apis.tableUpdate("club_applications", { ID: id, status: "approved" });
    if (error) throw new Error(error);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
  };

  const rejectApplication = async (id: number) => {
    const { error } = await window.ezsite.apis.tableUpdate("club_applications", { ID: id, status: "rejected" });
    if (error) throw new Error(error);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));
  };

  const toggleFollow = (id: string) => {
    setClubs((prev) =>
      prev.map((club) => (club.id === id ? { ...club, following: !club.following } : club))
    );
  };

  const requestToJoin = (id: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === id && club.membershipStatus === "none"
          ? { ...club, membershipStatus: "pending" }
          : club
      )
    );
  };

  const approveJoinRequest = (clubId: string, riderId: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId
          ? {
              ...club,
              memberIds: club.memberIds.includes(riderId) ? club.memberIds : [...club.memberIds, riderId],
              members: club.memberIds.includes(riderId) ? club.members : club.members + 1,
              pendingRequestIds: club.pendingRequestIds.filter((id) => id !== riderId),
            }
          : club
      )
    );
  };

  const declineJoinRequest = (clubId: string, riderId: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId
          ? { ...club, pendingRequestIds: club.pendingRequestIds.filter((id) => id !== riderId) }
          : club
      )
    );
  };

  const removeMember = (clubId: string, riderId: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId
          ? {
              ...club,
              memberIds: club.memberIds.filter((id) => id !== riderId),
              members: club.memberIds.includes(riderId) ? Math.max(0, club.members - 1) : club.members,
              coAdminIds: club.coAdminIds.filter((id) => id !== riderId),
              captainId: club.captainId === riderId ? undefined : club.captainId,
            }
          : club
      )
    );
  };

  const makeCoAdmin = (clubId: string, riderId: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId && !club.coAdminIds.includes(riderId)
          ? { ...club, coAdminIds: [...club.coAdminIds, riderId] }
          : club
      )
    );
  };

  const assignCaptain = (clubId: string, riderId: string) => {
    setClubs((prev) =>
      prev.map((club) => (club.id === clubId ? { ...club, captainId: riderId } : club))
    );
  };

  const transferAdmin = (clubId: string, adminHandle: string) => {
    setClubs((prev) =>
      prev.map((club) => (club.id === clubId ? { ...club, adminHandle } : club))
    );
  };

  const postAnnouncement = (clubId: string, text: string) => {
    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId
          ? {
              ...club,
              announcements: [
                { id: `a${Date.now()}`, text, createdAt: new Date().toISOString() },
                ...club.announcements,
              ],
            }
          : club
      )
    );
  };

  const updateClubSettings = (clubId: string, patch: Partial<Club>) => {
    setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, ...patch } : club)));
  };

  const deactivateClub = (clubId: string) => {
    setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, active: false } : club)));
  };

  return (
    <ClubsContext.Provider
      value={{
        clubs,
        toggleFollow,
        requestToJoin,
        approveJoinRequest,
        declineJoinRequest,
        removeMember,
        makeCoAdmin,
        assignCaptain,
        transferAdmin,
        postAnnouncement,
        updateClubSettings,
        deactivateClub,
        applications,
        applicationsLoading,
        pendingApplications,
        myApplication,
        refreshApplications,
        approveApplication,
        rejectApplication,
      }}
    >
      {children}
    </ClubsContext.Provider>
  );
};

export const useClubs = () => {
  const ctx = useContext(ClubsContext);
  if (!ctx) throw new Error("useClubs must be used within a ClubsProvider");
  return ctx;
};
