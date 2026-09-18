export const notifyWaitlistOnSpotOpen = async (rideId: number, rideTitle: string): Promise<void> => {
  const { data, error } = await window.ezsite.apis.tablePage("ride_participants", {
    PageNo: 1,
    PageSize: 500,
    Filters: [
      { name: "ride_id", op: "Equal", value: rideId },
      { name: "join_status", op: "Equal", value: "waitlisted" },
    ],
  });
  if (error) throw new Error(error);
  const rows = (data?.List ?? []) as Record<string, unknown>[];
  const now = new Date().toISOString();

  await Promise.all(
    rows.map((row) =>
      window.ezsite.apis.tableCreate("notifications", {
        user_id: Number(row.user_id),
        type: "general",
        message: `A spot opened on ${rideTitle}! Tap to claim it.`,
        related_ride_id: rideId,
        is_read: "no",
        created_at: now,
      })
    )
  );
};
