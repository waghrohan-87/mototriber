export const CONFIRMATION_EXPIRY_HOURS = 96;

export const getConfirmationDeadline = (rideDate: string, rideTime?: string): number => {
  const base = rideTime ? new Date(`${rideDate}T${rideTime}`) : new Date(rideDate);
  return base.getTime() + CONFIRMATION_EXPIRY_HOURS * 3600 * 1000;
};

export const isPastConfirmationDeadline = (rideDate: string, rideTime?: string): boolean => {
  const deadline = getConfirmationDeadline(rideDate, rideTime);
  return !Number.isNaN(deadline) && Date.now() > deadline;
};

/**
 * Fallback for rides left in "pending_confirmation" past the confirmation window:
 * marks the ride "expired" and every participant "not_attended" since nobody confirmed.
 */
export const expirePendingRide = async (rideId: number): Promise<boolean> => {
  const { error: rideError } = await window.ezsite.apis.tableUpdate("rides", {
    ID: rideId,
    status: "expired",
  });
  if (rideError) return false;

  const { data: participantData } = await window.ezsite.apis.tablePage("ride_participants", {
    PageNo: 1,
    PageSize: 500,
    Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
  });
  const rows = (participantData?.List ?? []) as Record<string, unknown>[];
  const goingRows = rows.filter((row) =>
    ["joined", "accepted"].includes(String(row.join_status ?? ""))
  );
  await Promise.all(
    goingRows.map((row) =>
      window.ezsite.apis.tableUpdate("ride_participants", {
        ID: Number(row.ID ?? row.id),
        attended: "not_attended",
      })
    )
  );
  return true;
};
