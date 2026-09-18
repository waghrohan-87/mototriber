import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Megaphone, Plus, Search, Settings, Star, UserCog, UserRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useClubs } from "@/context/ClubsContext";
import { useRides } from "@/context/RidesContext";
import { useRidersDirectory } from "@/context/RidersDirectoryContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInitials } from "@/components/club-registration/clubRegistrationTypes";
import { Rider } from "@/components/riders/RiderCard";
import { Ride } from "@/components/discover/RideCard";
import {
  assignClubCaptain,
  ClubMemberRecord,
  fetchClubMembers,
  removeClubMember,
  setClubMemberRole,
} from "@/lib/clubMembers";
import { ClubAnnouncementRecord, fetchClubAnnouncements, postClubAnnouncement } from "@/lib/clubAnnouncements";
import JoinRequestCard from "@/components/club-admin/JoinRequestCard";
import ClubMemberRow from "@/components/club-admin/ClubMemberRow";
import RideFormSheet, { RideFormValues } from "@/components/club-admin/RideFormSheet";
import AdminRideItem from "@/components/club-admin/AdminRideItem";
import AnnouncementSheet from "@/components/club-admin/AnnouncementSheet";
import ClubSettingsSheet from "@/components/club-admin/ClubSettingsSheet";
import TransferAdminSheet from "@/components/club-admin/TransferAdminSheet";
import ConfirmDialog from "@/components/club-admin/ConfirmDialog";

interface ClubRecord {
  id: number;
  name: string;
  logoUrl: string | null;
  adminUserId: number | null;
}

const SectionHeader = ({ title, badgeCount, plainCount }: { title: string; badgeCount?: number; plainCount?: number }) => (
  <div className="flex items-center gap-2">
    <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">{title}</h2>
    {badgeCount !== undefined && badgeCount > 0 && (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6600] px-1.5 text-[11px] font-bold text-white">
        {badgeCount}
      </span>
    )}
    {plainCount !== undefined && (
      <span className="text-xs font-semibold text-[#888888]">{plainCount}</span>
    )}
  </div>
);

const ClubAdminPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clubId = Number(id);

  const { user, loading: userLoading } = useCurrentUser();

  const { clubs: mockClubs, approveJoinRequest, declineJoinRequest, updateClubSettings, deactivateClub, transferAdmin } =
    useClubs();
  const { rides, addRide, updateRide, cancelRide } = useRides();
  const { riders } = useRidersDirectory();

  const [memberSearch, setMemberSearch] = useState("");
  const [rideFormOpen, setRideFormOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [cancelRideTarget, setCancelRideTarget] = useState<Ride | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [club, setClub] = useState<ClubRecord | null>(null);
  const [clubLoading, setClubLoading] = useState(true);
  const [members, setMembers] = useState<ClubMemberRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<ClubMemberRecord | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncementRecord[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  useEffect(() => {
    if (!clubId) {
      setClubLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setClubLoading(true);
      try {
        const { data, error } = await window.ezsite.apis.tablePage("clubs", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "ID", op: "Equal", value: clubId }],
        });
        if (error) throw new Error(error);
        const row = data?.List?.[0] as Record<string, unknown> | undefined;
        if (!cancelled) {
          setClub(
            row
              ? {
                  id: Number(row.ID ?? row.id),
                  name: String(row.name ?? ""),
                  logoUrl: (row.logo_url as string) || null,
                  adminUserId: row.admin_user_id ? Number(row.admin_user_id) : null,
                }
              : null
          );
        }
      } catch {
        if (!cancelled) setClub(null);
      } finally {
        if (!cancelled) setClubLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setMembersLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setMembersLoading(true);
      try {
        const rows = await fetchClubMembers(clubId);
        if (!cancelled) setMembers(rows);
      } catch (err) {
        if (!cancelled) {
          setMembers([]);
          toast({
            title: "Couldn't load members",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setAnnouncementsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setAnnouncementsLoading(true);
      try {
        const rows = await fetchClubAnnouncements(clubId);
        if (!cancelled) setAnnouncements(rows);
      } catch (err) {
        if (!cancelled) {
          setAnnouncements([]);
          toast({
            title: "Couldn't load announcements",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setAnnouncementsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const myMembership = useMemo(() => members.find((m) => m.userId === user?.userId), [members, user?.userId]);
  const isAuthorized = Boolean(user && club && (user.userId === club.adminUserId || myMembership?.role === "co-admin"));
  const accessChecked = !userLoading && !clubLoading && !membersLoading;

  useEffect(() => {
    if (!accessChecked || !club) return;
    if (!isAuthorized) navigate(`/club/${club.id}`, { replace: true });
  }, [accessChecked, isAuthorized, club, navigate]);

  const visibleMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return members;
    return members.filter((m) => m.username.toLowerCase().includes(query));
  }, [members, memberSearch]);

  // The sections below (join requests, rides, announcements, settings) aren't wired to
  // real tables yet, so they keep reading from the mock club directory.
  const mockClub = useMemo(() => mockClubs.find((c) => c.id === id), [mockClubs, id]);
  const mockMembers = useMemo(
    () =>
      mockClub
        ? mockClub.memberIds.map((mid) => riders.find((r) => r.id === mid)).filter((r): r is Rider => Boolean(r))
        : [],
    [mockClub, riders]
  );
  const pendingRiders = useMemo(
    () =>
      mockClub
        ? mockClub.pendingRequestIds.map((rid) => riders.find((r) => r.id === rid)).filter((r): r is Rider => Boolean(r))
        : [],
    [mockClub, riders]
  );

  const clubRides = useMemo(() => (club ? rides.filter((r) => r.poster.name === club.name) : []), [rides, club]);
  const upcomingRides = useMemo(() => clubRides.filter((r) => !r.isPast), [clubRides]);
  const pastRides = useMemo(() => clubRides.filter((r) => r.isPast), [clubRides]);

  if (clubLoading || userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-sm text-[#888888]">
        Loading club...
      </div>
    );
  }

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

  if (membersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-sm text-[#888888]">
        Loading club...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] px-8 text-center text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">Only the club admin or co-admins can manage {club.name}.</p>
      </div>
    );
  }

  const handleApprove = (rider: Rider) => {
    if (!mockClub) return;
    approveJoinRequest(mockClub.id, rider.id);
    toast({
      title: `${rider.name} approved`,
      description: `They were notified: "You've been approved to join ${mockClub.name} on MotoTriber."`,
    });
  };

  const handleDecline = (rider: Rider) => {
    if (!mockClub) return;
    declineJoinRequest(mockClub.id, rider.id);
    toast({ title: "Request declined", description: `${rider.name}'s request was removed.` });
  };

  const handleMakeCoAdmin = async (member: ClubMemberRecord) => {
    const label = member.username ? `@${member.username}` : member.fullName || "Member";
    const wasCaptain = member.role === "captain";
    try {
      await setClubMemberRole(member.membershipId, "co-admin", wasCaptain ? club.id : undefined);
      setMembers((prev) => prev.map((m) => (m.membershipId === member.membershipId ? { ...m, role: "co-admin" } : m)));
      toast({ title: `${label} is now a co-admin` });
    } catch (err) {
      toast({
        title: "Couldn't update role",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCoAdmin = async (member: ClubMemberRecord) => {
    const label = member.username ? `@${member.username}` : member.fullName || "Member";
    try {
      await setClubMemberRole(member.membershipId, "member");
      setMembers((prev) => prev.map((m) => (m.membershipId === member.membershipId ? { ...m, role: "member" } : m)));
      toast({ title: `${label} is no longer a co-admin` });
    } catch (err) {
      toast({
        title: "Couldn't update role",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignCaptain = async (member: ClubMemberRecord) => {
    const label = member.username ? `@${member.username}` : member.fullName || "Member";
    const previousCaptain = members.find((m) => m.role === "captain" && m.membershipId !== member.membershipId);
    try {
      await assignClubCaptain(club.id, club.name, member.membershipId, member.userId, previousCaptain?.membershipId ?? null);
      setMembers((prev) =>
        prev.map((m) => {
          if (m.membershipId === member.membershipId) return { ...m, role: "captain" };
          if (previousCaptain && m.membershipId === previousCaptain.membershipId) return { ...m, role: "member" };
          return m;
        })
      );
      toast({ title: `${label} is now the ride captain` });
    } catch (err) {
      toast({
        title: "Couldn't assign captain",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCaptain = async (member: ClubMemberRecord) => {
    const label = member.username ? `@${member.username}` : member.fullName || "Member";
    try {
      await setClubMemberRole(member.membershipId, "member", club.id);
      setMembers((prev) => prev.map((m) => (m.membershipId === member.membershipId ? { ...m, role: "member" } : m)));
      toast({ title: `${label} is no longer the ride captain` });
    } catch (err) {
      toast({
        title: "Couldn't remove captain",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeTarget) return;
    const label = removeTarget.username ? `@${removeTarget.username}` : removeTarget.fullName || "Member";
    try {
      await removeClubMember(
        removeTarget.membershipId,
        removeTarget.userId,
        club.name,
        club.id,
        removeTarget.role === "captain"
      );
      setMembers((prev) => prev.filter((m) => m.membershipId !== removeTarget.membershipId));
      toast({ title: "Member removed", description: `${label} was notified they were removed from ${club.name}.` });
    } catch (err) {
      toast({
        title: "Couldn't remove member",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemoveTarget(null);
    }
  };

  const handleRideSubmit = (values: RideFormValues) => {
    if (editingRide) {
      updateRide(editingRide.id, (r) => ({
        ...r,
        title: values.title,
        date: values.date,
        time: values.time,
        distance: values.distance,
        meetingPoint: values.meetingPoint,
        spotsTotal: Number(values.spotsTotal) || r.spotsTotal,
      }));
      toast({ title: "Ride updated" });
    } else {
      addRide({
        id: `r${Date.now()}`,
        title: values.title,
        type: "club",
        date: values.date,
        time: values.time,
        distance: values.distance,
        meetingPoint: values.meetingPoint,
        poster: { name: club.name },
        spotsTaken: 0,
        spotsTotal: Number(values.spotsTotal) || 0,
        joined: false,
        viewerIsClubMember: true,
        joinedRiders: [],
      });
      toast({ title: "Ride created", description: `"${values.title}" was added to the club's rides.` });
    }
    setRideFormOpen(false);
    setEditingRide(null);
  };

  const handleConfirmCancelRide = () => {
    if (!cancelRideTarget) return;
    cancelRide(cancelRideTarget.id);
    toast({ title: "Ride cancelled", description: `"${cancelRideTarget.title}" was removed.` });
    setCancelRideTarget(null);
  };

  const handlePostAnnouncement = async (text: string) => {
    if (!user) return;
    setPostingAnnouncement(true);
    try {
      await postClubAnnouncement(club.id, club.name, user.userId, text);
      const rows = await fetchClubAnnouncements(club.id);
      setAnnouncements(rows);
      setAnnouncementOpen(false);
      toast({ title: "Announcement posted." });
    } catch (err) {
      toast({
        title: "Couldn't post announcement",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleTransfer = (rider: Rider) => {
    if (!mockClub) return;
    transferAdmin(mockClub.id, rider.handle);
    toast({ title: "Admin rights transferred", description: `${rider.name} is now the club admin.` });
    setTransferOpen(false);
    navigate(`/club/${club.id}`);
  };

  const handleDeactivate = () => {
    if (mockClub) deactivateClub(mockClub.id);
    toast({ title: "Club deactivated", description: `${club.name} is no longer visible to riders.` });
    navigate("/clubs");
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
          {club.logoUrl ? (
            <img src={club.logoUrl} alt={club.name} className="h-8 w-8 shrink-0 rounded-lg border border-[#333333] object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#333333] bg-[#2A1608] text-[10px] font-bold text-[#FF9D4D]">
              {getInitials(club.name)}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#F0F0F0]">{club.name}</span>
          <span className="shrink-0 rounded-full bg-[#FF6600] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Admin
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <SectionHeader title="Pending join requests" badgeCount={pendingRiders.length} />
            {pendingRiders.length === 0 ? (
              <p className="text-sm text-[#888888]">No pending requests right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingRiders.map((rider) => (
                  <JoinRequestCard
                    key={rider.id}
                    rider={rider}
                    onApprove={() => handleApprove(rider)}
                    onDecline={() => handleDecline(rider)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <SectionHeader title="Members" plainCount={members.length} />
            <button
              type="button"
              onClick={() => navigate(`/club/${club.id}/find-organisers`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF6600] py-3.5 text-sm font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <UserRound className="h-4 w-4" />
                <Star className="absolute -bottom-1 -right-1 h-2.5 w-2.5 fill-current" />
              </span>
              Find ride organisers
            </button>
            <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-[#666666]" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by username..."
                className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
              />
            </div>
            {visibleMembers.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#888888]">No members found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleMembers.map((member) => (
                  <ClubMemberRow
                    key={member.membershipId}
                    member={member}
                    isClubOwner={club.adminUserId === member.userId}
                    onMakeCoAdmin={() => handleMakeCoAdmin(member)}
                    onRemoveCoAdmin={() => handleRemoveCoAdmin(member)}
                    onAssignCaptain={() => handleAssignCaptain(member)}
                    onRemoveCaptain={() => handleRemoveCaptain(member)}
                    onRemove={() => setRemoveTarget(member)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <SectionHeader title="Rides" />
            <button
              type="button"
              onClick={() => {
                setEditingRide(null);
                setRideFormOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Create a new ride
            </button>

            <div className="flex flex-col gap-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#888888]">Upcoming</h3>
              {upcomingRides.length === 0 ? (
                <p className="text-sm text-[#888888]">No upcoming rides.</p>
              ) : (
                upcomingRides.map((ride) => (
                  <AdminRideItem
                    key={ride.id}
                    ride={ride}
                    onEdit={() => {
                      setEditingRide(ride);
                      setRideFormOpen(true);
                    }}
                    onCancel={() => setCancelRideTarget(ride)}
                  />
                ))
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#888888]">Past</h3>
              {pastRides.length === 0 ? (
                <p className="text-sm text-[#888888]">No past rides yet.</p>
              ) : (
                pastRides.map((ride) => (
                  <AdminRideItem
                    key={ride.id}
                    ride={ride}
                    onConfirmAttendance={() => navigate(`/ride/${ride.id}/confirm-attendance`)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <SectionHeader title="Announcements" />
            <button
              type="button"
              onClick={() => setAnnouncementOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF6600] py-3.5 text-sm font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
            >
              <Megaphone className="h-4 w-4" />
              Post announcement
            </button>

            {announcementsLoading ? (
              <p className="text-sm text-[#888888]">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-[#888888]">No announcements yet.</p>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex flex-col gap-1 rounded-[14px] border border-[#2A2A2A] bg-[#151515] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#FF9D4D]">
                        {announcement.posterUsername ? `@${announcement.posterUsername}` : "Admin"}
                      </span>
                      <span className="text-[11px] text-[#666666]">
                        {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-[#F0F0F0]">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 px-5 py-5">
            <SectionHeader title="Club settings" />

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-[#333333] px-4 py-3 text-left text-sm font-semibold text-[#F0F0F0] transition-colors active:bg-[#222222]"
            >
              <Settings className="h-4 w-4 text-[#888888]" />
              Edit club details
            </button>

            <button
              type="button"
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-[#333333] px-4 py-3 text-left text-sm font-semibold text-[#F0F0F0] transition-colors active:bg-[#222222]"
            >
              <UserCog className="h-4 w-4 text-[#888888]" />
              Change admin
            </button>

            <button
              type="button"
              onClick={() => setDeactivateOpen(true)}
              className="mt-2 w-full rounded-xl border border-[#DC2626]/40 py-3.5 text-sm font-bold text-[#DC2626] transition-transform active:scale-[0.98]"
            >
              Deactivate club
            </button>
          </div>
        </div>
      </div>

      <RideFormSheet
        open={rideFormOpen}
        onOpenChange={(open) => {
          setRideFormOpen(open);
          if (!open) setEditingRide(null);
        }}
        ride={editingRide}
        onSubmit={handleRideSubmit}
      />

      <ConfirmDialog
        open={Boolean(cancelRideTarget)}
        onOpenChange={(open) => !open && setCancelRideTarget(null)}
        title="Cancel this ride?"
        description={`"${cancelRideTarget?.title}" will be removed and riders who joined will no longer see it.`}
        confirmLabel="Cancel ride"
        onConfirm={handleConfirmCancelRide}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.username ? `@${removeTarget.username}` : "this member"}?`}
        description={`They'll lose access to club rides and be notified they were removed from ${club.name}. This can't be undone.`}
        confirmLabel="Remove"
        onConfirm={handleConfirmRemoveMember}
      />

      <AnnouncementSheet
        open={announcementOpen}
        onOpenChange={setAnnouncementOpen}
        onSend={handlePostAnnouncement}
        posting={postingAnnouncement}
      />

      {mockClub && (
        <ClubSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          club={mockClub}
          onSave={(patch) => updateClubSettings(mockClub.id, patch)}
        />
      )}

      <TransferAdminSheet open={transferOpen} onOpenChange={setTransferOpen} members={mockMembers} onTransfer={handleTransfer} />

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={`Deactivate ${club.name}?`}
        description="Members will no longer be able to find or interact with this club. This can't be undone."
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
      />
    </motion.div>
  );
};

export default ClubAdminPage;
