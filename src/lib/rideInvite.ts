const RIDE_ID_KEY = "pending_invite_ride_id";
const NOTIFIED_KEY = "pending_invite_notified";

export const setPendingRideInvite = (rideId: string) => {
  localStorage.setItem(RIDE_ID_KEY, rideId);
  localStorage.removeItem(NOTIFIED_KEY);
};

export const getPendingRideInviteId = (): string | null => localStorage.getItem(RIDE_ID_KEY);

export const clearPendingRideInvite = () => {
  localStorage.removeItem(RIDE_ID_KEY);
  localStorage.removeItem(NOTIFIED_KEY);
};

export const notifyPendingRideInvite = async (userId: number) => {
  const rideId = getPendingRideInviteId();
  if (!rideId || localStorage.getItem(NOTIFIED_KEY) === "1") return;

  const { error } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: userId,
    type: "general",
    message: "Here's the ride you were invited to — tap to view",
    related_ride_id: Number(rideId),
    is_read: "no",
    created_at: new Date().toISOString(),
  });
  if (!error) localStorage.setItem(NOTIFIED_KEY, "1");
};
