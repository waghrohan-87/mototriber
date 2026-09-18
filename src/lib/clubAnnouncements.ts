export interface ClubAnnouncementRecord {
  id: number;
  clubId: number;
  postedByUserId: number;
  posterUsername: string;
  message: string;
  createdAt: string;
}

export const fetchClubAnnouncements = async (
  clubId: number,
  limit = 500
): Promise<ClubAnnouncementRecord[]> => {
  const { data, error } = await window.ezsite.apis.tablePage("club_announcements", {
    PageNo: 1,
    PageSize: limit,
    OrderByField: "created_at",
    IsAsc: false,
    Filters: [{ name: "club_id", op: "Equal", value: clubId }],
  });
  if (error) throw new Error(error);
  const rows = (data?.List ?? []) as Record<string, unknown>[];

  const uniqueUserIds = Array.from(new Set(rows.map((r) => Number(r.posted_by_user_id))));
  const profiles = await Promise.all(
    uniqueUserIds.map(async (uid) => {
      const { data: profileData } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: uid }],
      });
      const profile = profileData?.List?.[0] as Record<string, unknown> | undefined;
      return { userId: uid, username: String(profile?.username ?? "") };
    })
  );
  const usernameByUserId = new Map(profiles.map((p) => [p.userId, p.username]));

  return rows.map((row) => ({
    id: Number(row.ID ?? row.id),
    clubId: Number(row.club_id),
    postedByUserId: Number(row.posted_by_user_id),
    posterUsername: usernameByUserId.get(Number(row.posted_by_user_id)) ?? "",
    message: String(row.message ?? ""),
    createdAt: String(row.created_at ?? ""),
  }));
};

export const postClubAnnouncement = async (
  clubId: number,
  clubName: string,
  posterUserId: number,
  message: string
): Promise<void> => {
  const nowIso = new Date().toISOString();
  const { error } = await window.ezsite.apis.tableCreate("club_announcements", {
    club_id: clubId,
    posted_by_user_id: posterUserId,
    message,
    created_at: nowIso,
  });
  if (error) throw new Error(error);

  const { data: memberData, error: memberError } = await window.ezsite.apis.tablePage("club_members", {
    PageNo: 1,
    PageSize: 1000,
    Filters: [{ name: "club_id", op: "Equal", value: clubId }],
  });
  if (memberError) throw new Error(memberError);
  const memberRows = (memberData?.List ?? []) as Record<string, unknown>[];
  const recipientUserIds = memberRows
    .map((row) => Number(row.user_id))
    .filter((uid) => uid !== posterUserId);

  const excerpt = message.slice(0, 60);
  const results = await Promise.all(
    recipientUserIds.map((uid) =>
      window.ezsite.apis.tableCreate("notifications", {
        user_id: uid,
        type: "general",
        message: `${clubName}: ${excerpt}`,
        related_club_id: clubId,
        is_read: "no",
        created_at: nowIso,
      })
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error);
};
