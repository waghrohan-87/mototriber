import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInitials } from "@/components/club-registration/clubRegistrationTypes";
import ClubSocialRow from "@/components/clubs/ClubSocialRow";
import BikeTagPill from "@/components/shared/BikeTagPill";
import BadgePill from "@/components/shared/BadgePill";
import { AttendanceTier, MIN_CONFIRMED_RIDES, getAttendanceTier } from "@/lib/reputation";
import { ClubAnnouncementRecord, fetchClubAnnouncements } from "@/lib/clubAnnouncements";

interface ClubDetail {
  id: number;
  name: string;
  city: string;
  bikeTypeFocus: string;
  description: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  websiteUrl: string | null;
  adminUserId: number | null;
  captainUserId: number | null;
}

interface MemberProfile {
  userId: number;
  fullName: string;
  username: string;
  profilePhotoUrl: string | null;
}

const ClubProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const clubId = Number(id);

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [captain, setCaptain] = useState<MemberProfile | null>(null);
  const [captainTier, setCaptainTier] = useState<AttendanceTier | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncementRecord[]>([]);
  const [myMembershipId, setMyMembershipId] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await window.ezsite.apis.tablePage("clubs", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "ID", op: "Equal", value: clubId }],
        });
        if (error) throw new Error(error);
        const row = data?.List?.[0] as Record<string, unknown> | undefined;
        if (!row) {
          if (!cancelled) setClub(null);
          return;
        }

        const detail: ClubDetail = {
          id: Number(row.ID ?? row.id),
          name: String(row.name ?? ""),
          city: String(row.city ?? ""),
          bikeTypeFocus: String(row.bike_type_focus ?? ""),
          description: String(row.description ?? ""),
          logoUrl: (row.logo_url as string) || null,
          whatsappNumber: (row.whatsapp_number as string) || null,
          instagramHandle: (row.instagram_handle as string) || null,
          facebookUrl: (row.facebook_url as string) || null,
          youtubeUrl: (row.youtube_url as string) || null,
          websiteUrl: (row.website_url as string) || null,
          adminUserId: row.admin_user_id ? Number(row.admin_user_id) : null,
          captainUserId: row.captain_user_id ? Number(row.captain_user_id) : null,
        };
        if (cancelled) return;
        setClub(detail);

        const { data: memberData, error: memberError } = await window.ezsite.apis.tablePage("club_members", {
          PageNo: 1,
          PageSize: 8,
          OrderByField: "ID",
          IsAsc: true,
          Filters: [{ name: "club_id", op: "Equal", value: detail.id }],
        });
        if (memberError) throw new Error(memberError);
        const memberRows = (memberData?.List ?? []) as Record<string, unknown>[];
        if (!cancelled) setMemberCount(memberData?.VirtualCount ?? memberRows.length);

        const uniqueUserIds = Array.from(new Set(memberRows.map((m) => Number(m.user_id))));
        const profiles = await Promise.all(
          uniqueUserIds.map(async (uid) => {
            const { data: pData } = await window.ezsite.apis.tablePage("user_profiles", {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: "user_id", op: "Equal", value: uid }],
            });
            const p = pData?.List?.[0] as Record<string, unknown> | undefined;
            return {
              userId: uid,
              fullName: String(p?.full_name ?? ""),
              username: String(p?.username ?? ""),
              profilePhotoUrl: (p?.profile_photo_url as string) || null,
            };
          })
        );
        if (cancelled) return;
        setMembers(profiles);

        if (detail.captainUserId) {
          const found = profiles.find((p) => p.userId === detail.captainUserId);
          if (found) {
            setCaptain(found);
          } else {
            const { data: cData } = await window.ezsite.apis.tablePage("user_profiles", {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: "user_id", op: "Equal", value: detail.captainUserId }],
            });
            const cp = cData?.List?.[0] as Record<string, unknown> | undefined;
            if (!cancelled) {
              setCaptain({
                userId: detail.captainUserId,
                fullName: String(cp?.full_name ?? ""),
                username: String(cp?.username ?? ""),
                profilePhotoUrl: (cp?.profile_photo_url as string) || null,
              });
            }
          }

          const { data: participantData, error: participantError } = await window.ezsite.apis.tablePage(
            "ride_participants",
            { PageNo: 1, PageSize: 1000, Filters: [{ name: "user_id", op: "Equal", value: detail.captainUserId }] }
          );
          if (participantError) throw new Error(participantError);
          const participantRows = (participantData?.List ?? []) as Record<string, unknown>[];
          const confirmedRows = participantRows.filter((r) =>
            ["attended", "not_attended"].includes(String(r.attended ?? ""))
          );
          const attendedRows = confirmedRows.filter((r) => String(r.attended) === "attended");
          const attendanceRate =
            confirmedRows.length >= MIN_CONFIRMED_RIDES
              ? Math.round((attendedRows.length / confirmedRows.length) * 100)
              : 0;
          if (!cancelled) setCaptainTier(getAttendanceTier(attendanceRate, confirmedRows.length));
        }

        const announcementRows = await fetchClubAnnouncements(detail.id, 3);
        if (!cancelled) setAnnouncements(announcementRows);

        if (user) {
          const { data: myData } = await window.ezsite.apis.tablePage("club_members", {
            PageNo: 1,
            PageSize: 1,
            Filters: [
              { name: "club_id", op: "Equal", value: detail.id },
              { name: "user_id", op: "Equal", value: user.userId },
            ],
          });
          const myRow = myData?.List?.[0] as Record<string, unknown> | undefined;
          if (!cancelled) setMyMembershipId(myRow ? Number(myRow.ID ?? myRow.id) : null);
        }
      } catch (err) {
        toast({
          title: "Couldn't load club",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, user?.userId]);

  const isAdmin = Boolean(user && club?.adminUserId === user.userId);

  const handleJoin = async () => {
    if (!user || !club) {
      toast({ title: "Please sign in", description: "Sign in to join this club.", variant: "destructive" });
      return;
    }
    if (isAdmin) {
      navigate(`/club/${club.id}/admin`);
      return;
    }
    if (myMembershipId) return;

    setJoining(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate("club_members", {
        club_id: club.id,
        user_id: user.userId,
        role: "member",
        joined_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);

      const { data: myData } = await window.ezsite.apis.tablePage("club_members", {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: "club_id", op: "Equal", value: club.id },
          { name: "user_id", op: "Equal", value: user.userId },
        ],
      });
      const myRow = myData?.List?.[0] as Record<string, unknown> | undefined;
      setMyMembershipId(myRow ? Number(myRow.ID ?? myRow.id) : null);
      setMemberCount((c) => c + 1);
      toast({ title: "You're in!", description: `You've joined ${club.name}.` });
    } catch (err) {
      toast({
        title: "Couldn't join",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
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

  const joinLabel = isAdmin ? "Manage club" : myMembershipId ? "Member" : joining ? "Joining..." : "Request to join";
  const joinDisabled = !isAdmin && (Boolean(myMembershipId) || joining);
  const joinClass = isAdmin
    ? "w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
    : myMembershipId
    ? "w-full cursor-default rounded-xl bg-[#2A2A2A] py-3.5 text-sm font-bold text-[#888888]"
    : "w-full rounded-xl border border-[#FF6600] py-3.5 text-sm font-bold text-[#FF6600] transition-transform active:scale-[0.98] disabled:opacity-60";

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
          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <div className="flex items-start gap-3">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-[#333333] object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#333333] bg-[#2A1608] text-lg font-bold text-[#FF9D4D]">
                  {getInitials(club.name)}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                <h1 className="text-[20px] font-bold leading-snug text-[#F0F0F0]">{club.name}</h1>
                <p className="text-[13px] text-[#888888]">{club.city}</p>
                <BikeTagPill label={club.bikeTypeFocus} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#AAAAAA]">{club.description}</p>

            <div className="flex items-center gap-1.5 text-sm text-[#F0F0F0]">
              <Users className="h-4 w-4 text-[#888888]" />
              <span className="font-bold">{memberCount.toLocaleString()}</span>
              <span className="text-[#888888]">{memberCount === 1 ? "member" : "members"}</span>
            </div>

            <ClubSocialRow
              whatsappNumber={club.whatsappNumber}
              instagramHandle={club.instagramHandle}
              facebookUrl={club.facebookUrl}
              youtubeUrl={club.youtubeUrl}
              websiteUrl={club.websiteUrl}
            />
          </div>

          {captain && (
            <button
              type="button"
              onClick={() => navigate(`/rider/${captain.userId}`)}
              className="flex w-full items-center gap-3 border-b border-[#2A2A2A] px-5 py-5 text-left transition-colors active:bg-[#1A1A1A]"
            >
              {captain.profilePhotoUrl ? (
                <img
                  src={captain.profilePhotoUrl}
                  alt={captain.fullName || captain.username}
                  className="h-10 w-10 shrink-0 rounded-full border border-[#333333] object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2A1608] text-xs font-bold text-[#FF9D4D]">
                  {getInitials(captain.fullName || captain.username || "?")}
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm text-[#AAAAAA]">
                  Ride captain:{" "}
                  <span className="font-semibold text-[#F0F0F0]">
                    {captain.username ? `@${captain.username}` : captain.fullName || "Rider"}
                  </span>
                </span>
                {captainTier && (
                  <BadgePill
                    label={captainTier.label}
                    color={captainTier.color}
                    background={captainTier.background}
                    border={captainTier.border}
                  />
                )}
              </div>
            </button>
          )}

          {announcements.length > 0 && (
            <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Announcements</h2>
              <div className="flex flex-col gap-2">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex flex-col gap-1 rounded-[14px] border border-[#2A2A2A] bg-[#151515] px-3.5 py-3"
                  >
                    <p className="text-sm text-[#F0F0F0]">{announcement.message}</p>
                    <span className="text-[11px] text-[#666666]">
                      {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Members</h2>
            {members.length === 0 ? (
              <p className="text-sm text-[#888888]">No members yet</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {members.map((member) =>
                  member.profilePhotoUrl ? (
                    <img
                      key={member.userId}
                      src={member.profilePhotoUrl}
                      alt={member.fullName || member.username}
                      title={member.fullName || member.username}
                      className="h-11 w-11 shrink-0 rounded-full border border-[#333333] object-cover"
                    />
                  ) : (
                    <span
                      key={member.userId}
                      title={member.fullName || member.username}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A1608] text-xs font-bold text-[#FF9D4D]"
                    >
                      {getInitials(member.fullName || member.username || "?")}
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-5">
            <button type="button" onClick={handleJoin} disabled={joinDisabled} className={joinClass}>
              {joinLabel}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubProfilePage;
