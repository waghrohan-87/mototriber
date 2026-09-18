import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  PenLine,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useNotifications, CaptainInviteNotification } from "@/context/NotificationsContext";
import { useClubs } from "@/context/ClubsContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { avatarTintForName } from "@/lib/avatarTint";
import { AvatarTint } from "@/components/riders/RiderCard";
import {
  ConnectionRecord,
  acceptConnectionRequest,
  declineConnectionRequest,
  fetchConnectionsForUser,
  formatRiderLabel,
} from "@/lib/connections";

const CONNECT_REQUEST_SUFFIX = " wants to connect";

const TINT_STYLES: Record<AvatarTint, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

const getInitials = (label: string) => {
  const clean = label.replace(/^@/, "");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length > 1) {
    return parts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

interface NotificationRow {
  id: number;
  type: string;
  message: string;
  relatedRideId: number | null;
  relatedClubId: number | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  join_approved: CheckCircle2,
  join_request: UserPlus,
  ride_edited: PenLine,
  ride_cancelled: XCircle,
  attendance_confirmed: BadgeCheck,
  connect_request: Users,
  club_pending_review: ShieldCheck,
  club_approved: ShieldCheck,
  club_rejected: XCircle,
  general: Bell,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, respondToCaptainInvite } = useNotifications();
  const { assignCaptain } = useClubs();
  const { user } = useCurrentUser();

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [connectPending, setConnectPending] = useState<Set<number>>(new Set());

  const loadConnections = async () => {
    if (!user) {
      setConnections([]);
      return;
    }
    try {
      setConnections(await fetchConnectionsForUser(user.userId));
    } catch {
      setConnections([]);
    }
  };

  const loadNotifications = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await window.ezsite.apis.tablePage("notifications", {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "created_at",
        IsAsc: false,
        Filters: [{ name: "user_id", op: "Equal", value: user.userId }],
      });
      if (error) throw new Error(error);
      const rows = (data?.List ?? []) as Record<string, unknown>[];
      setItems(
        rows.map((r) => ({
          id: Number(r.ID ?? r.id),
          type: String(r.type || "general"),
          message: String(r.message || ""),
          relatedRideId: r.related_ride_id ? Number(r.related_ride_id) : null,
          relatedClubId: r.related_club_id ? Number(r.related_club_id) : null,
          isRead: String(r.is_read) === "yes",
          createdAt: String(r.created_at || new Date().toISOString()),
        }))
      );
    } catch (err) {
      toast({
        title: "Couldn't load notifications",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const findConnectionForNotification = (notification: NotificationRow) =>
    connections.find(
      (record) => record.targetUserId === user?.userId && record.createdAt === notification.createdAt
    );

  const handleAcceptConnection = async (notification: NotificationRow, record: ConnectionRecord) => {
    if (!user) return;
    setConnectPending((prev) => new Set(prev).add(notification.id));
    try {
      await acceptConnectionRequest(record, formatRiderLabel(user.username, user.fullName));
      await loadConnections();
      toast({ title: "Connection accepted" });
    } catch (err) {
      toast({
        title: "Couldn't accept request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectPending((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  const handleDeclineConnection = async (notification: NotificationRow, record: ConnectionRecord) => {
    setConnectPending((prev) => new Set(prev).add(notification.id));
    try {
      await declineConnectionRequest(record);
      await loadConnections();
    } catch (err) {
      toast({
        title: "Couldn't decline request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectPending((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  const sortedInvites = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  );

  const handleAccept = (notification: CaptainInviteNotification) => {
    assignCaptain(notification.clubId, notification.riderId);
    respondToCaptainInvite(notification.id, "accepted");
    toast({ title: "Invite accepted", description: `You are now a ride captain for ${notification.clubName}.` });
  };

  const handleDecline = (notification: CaptainInviteNotification) => {
    respondToCaptainInvite(notification.id, "declined");
    toast({ title: "Invite declined" });
  };

  const handleTapNotification = async (notification: NotificationRow) => {
    if (!notification.isRead) {
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      try {
        const { error } = await window.ezsite.apis.tableUpdate("notifications", {
          ID: notification.id,
          is_read: "yes",
        });
        if (error) throw new Error(error);
      } catch (err) {
        toast({
          title: "Couldn't mark as read",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    }
    if (notification.type === "club_pending_review" && notification.relatedClubId) {
      navigate("/admin-panel");
      return;
    }
    if (notification.type === "club_approved" && notification.relatedClubId) {
      navigate(`/club/${notification.relatedClubId}/admin`);
      return;
    }
    if (notification.relatedRideId) {
      navigate(`/ride/${notification.relatedRideId}`);
    }
  };

  const hasContent = sortedInvites.length > 0 || items.length > 0;

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
          <span className="text-sm font-bold text-[#F0F0F0]">Notifications</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!loading && !hasContent ? (
            <p className="py-10 text-center text-sm text-[#888888]">No notifications yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedInvites.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col gap-2 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5"
                >
                  <p className="text-sm leading-snug text-[#F0F0F0]">
                    <span className="font-bold">{notification.clubName}</span> has invited you to be a ride captain.{" "}
                    <span className="font-semibold text-[#FF6600]">View invite →</span>
                  </p>
                  <span className="text-[11px] text-[#666666]">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  {notification.status === "pending" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAccept(notification)}
                        className="flex-1 rounded-xl border border-[#16A34A] py-2.5 text-xs font-bold text-[#16A34A] transition-transform active:scale-[0.98]"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(notification)}
                        className="flex-1 rounded-xl border border-[#555555] py-2.5 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-[0.98]"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-bold",
                        notification.status === "accepted" ? "text-[#16A34A]" : "text-[#AAAAAA]"
                      )}
                    >
                      {notification.status === "accepted" ? "Accepted" : "Declined"}
                    </span>
                  )}
                </div>
              ))}

              {items.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;

                if (notification.type === "connect_request") {
                  const record = findConnectionForNotification(notification);
                  const isPending = connectPending.has(notification.id);
                  const requesterLabel = notification.message.endsWith(CONNECT_REQUEST_SUFFIX)
                    ? notification.message.slice(0, -CONNECT_REQUEST_SUFFIX.length)
                    : null;
                  const openRequesterProfile = (e: MouseEvent) => {
                    e.stopPropagation();
                    if (record) navigate(`/rider/${record.requesterUserId}`);
                  };
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleTapNotification(notification)}
                      className={cn(
                        "flex cursor-pointer flex-col gap-2 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5 text-left transition-colors active:bg-[#222222]",
                        !notification.isRead && "border-l-2 border-l-[#FF6600]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {record && requesterLabel ? (
                          <button
                            type="button"
                            onClick={openRequesterProfile}
                            aria-label={`View ${requesterLabel}'s profile`}
                            className="shrink-0"
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                                TINT_STYLES[avatarTintForName(requesterLabel)]
                              )}
                            >
                              {getInitials(requesterLabel)}
                            </span>
                          </button>
                        ) : (
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6600]" />
                        )}
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="text-sm leading-snug text-[#F0F0F0]">
                            {record && requesterLabel ? (
                              <>
                                <button
                                  type="button"
                                  onClick={openRequesterProfile}
                                  className="font-bold text-[#F0F0F0] hover:underline"
                                >
                                  {requesterLabel}
                                </button>
                                {CONNECT_REQUEST_SUFFIX}
                              </>
                            ) : (
                              notification.message
                            )}
                          </p>
                          <span className="text-[11px] text-[#666666]">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {record?.status === "pending" && (
                        <div className="flex items-center gap-2 pl-7">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptConnection(notification, record);
                            }}
                            disabled={isPending}
                            className="flex-1 rounded-xl border border-[#16A34A] py-2.5 text-xs font-bold text-[#16A34A] transition-transform active:scale-[0.98] disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineConnection(notification, record);
                            }}
                            disabled={isPending}
                            className="flex-1 rounded-xl border border-[#555555] py-2.5 text-xs font-bold text-[#AAAAAA] transition-transform active:scale-[0.98] disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {record?.status === "connected" && (
                        <span className="pl-7 text-xs font-bold text-[#16A34A]">Accepted</span>
                      )}
                      {record?.status === "declined" && (
                        <span className="pl-7 text-xs font-bold text-[#AAAAAA]">Declined</span>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleTapNotification(notification)}
                    className={cn(
                      "flex items-start gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5 text-left transition-colors active:bg-[#222222]",
                      !notification.isRead && "border-l-2 border-l-[#FF6600]"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6600]" />
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm leading-snug text-[#F0F0F0]">{notification.message}</p>
                      <span className="text-[11px] text-[#666666]">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
