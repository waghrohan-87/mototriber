export type ClubMemberRole = "member" | "co-admin" | "captain";

export interface ClubMemberRecord {
  membershipId: number;
  userId: number;
  role: ClubMemberRole;
  username: string;
  fullName: string;
  city: string;
}

const toRole = (value: unknown): ClubMemberRole => {
  const role = String(value || "member");
  return role === "co-admin" || role === "captain" ? role : "member";
};

export const fetchClubMembers = async (clubId: number): Promise<ClubMemberRecord[]> => {
  const { data, error } = await window.ezsite.apis.tablePage("club_members", {
    PageNo: 1,
    PageSize: 500,
    OrderByField: "ID",
    IsAsc: true,
    Filters: [{ name: "club_id", op: "Equal", value: clubId }],
  });
  if (error) throw new Error(error);
  const rows = (data?.List ?? []) as Record<string, unknown>[];

  return Promise.all(
    rows.map(async (row) => {
      const userId = Number(row.user_id);
      const { data: profileData } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: userId }],
      });
      const profile = profileData?.List?.[0] as Record<string, unknown> | undefined;
      return {
        membershipId: Number(row.ID ?? row.id),
        userId,
        role: toRole(row.role),
        username: String(profile?.username ?? ""),
        fullName: String(profile?.full_name ?? ""),
        city: String(profile?.city ?? ""),
      };
    })
  );
};

export const setClubMemberRole = async (
  membershipId: number,
  role: ClubMemberRole,
  demoteFromCaptainClubId?: number
): Promise<void> => {
  const { error } = await window.ezsite.apis.tableUpdate("club_members", { ID: membershipId, role });
  if (error) throw new Error(error);

  if (demoteFromCaptainClubId) {
    const { error: clubError } = await window.ezsite.apis.tableUpdate("clubs", {
      ID: demoteFromCaptainClubId,
      captain_user_id: null,
    });
    if (clubError) throw new Error(clubError);
  }
};

export const assignClubCaptain = async (
  clubId: number,
  clubName: string,
  membershipId: number,
  userId: number,
  previousCaptainMembershipId: number | null
): Promise<void> => {
  if (previousCaptainMembershipId && previousCaptainMembershipId !== membershipId) {
    await setClubMemberRole(previousCaptainMembershipId, "member");
  }
  await setClubMemberRole(membershipId, "captain");
  const { error } = await window.ezsite.apis.tableUpdate("clubs", { ID: clubId, captain_user_id: userId });
  if (error) throw new Error(error);

  const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: userId,
    type: "general",
    message: `You've been made ride captain for ${clubName}.`,
    related_club_id: clubId,
    is_read: "no",
    created_at: new Date().toISOString(),
  });
  if (notifyError) throw new Error(notifyError);
};

export const removeClubMember = async (
  membershipId: number,
  userId: number,
  clubName: string,
  clubId: number,
  wasCaptain: boolean
): Promise<void> => {
  const { error } = await window.ezsite.apis.tableDelete("club_members", { ID: membershipId });
  if (error) throw new Error(error);

  if (wasCaptain) {
    const { error: clubError } = await window.ezsite.apis.tableUpdate("clubs", { ID: clubId, captain_user_id: null });
    if (clubError) throw new Error(clubError);
  }

  const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: userId,
    type: "general",
    message: `You have been removed from ${clubName}.`,
    is_read: "no",
    created_at: new Date().toISOString(),
  });
  if (notifyError) throw new Error(notifyError);
};
