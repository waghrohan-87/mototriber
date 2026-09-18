import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInitials } from "@/components/discover/RideCard";
import { formatHandle } from "@/components/riders/RiderCard";
import BikeTagPill from "@/components/shared/BikeTagPill";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { fetchConnectedUserIds, formatRiderLabel } from "@/lib/connections";
import { tintForName } from "@/lib/avatarTint";

interface ConnectedRider {
  userId: number;
  name: string;
  handle: string;
  city: string;
  bike: string;
  attendanceRate: number | null;
  tint: { background: string; color: string };
}

const SectionDivider = () => (
  <div className="my-5 flex items-center gap-3">
    <div className="h-px flex-1 bg-[#333333]" />
    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#666666]">or</span>
    <div className="h-px flex-1 bg-[#333333]" />
  </div>
);

interface InviteRiderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  rideTitle: string;
}

const InviteRiderSheet = ({ open, onOpenChange, rideId, rideTitle }: InviteRiderSheetProps) => {
  const { user } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [riders, setRiders] = useState<ConnectedRider[]>([]);
  const [loading, setLoading] = useState(false);

  const inviteLink = `mototriber.com/ride/${rideId}/invite`;

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const connectedIds = await fetchConnectedUserIds(user.userId);
        const results = await Promise.all(
          connectedIds.map(async (uid) => {
            const [profileResult, participantResult] = await Promise.all([
              window.ezsite.apis.tablePage("user_profiles", {
                PageNo: 1,
                PageSize: 1,
                Filters: [{ name: "user_id", op: "Equal", value: uid }],
              }),
              window.ezsite.apis.tablePage("ride_participants", {
                PageNo: 1,
                PageSize: 500,
                Filters: [{ name: "user_id", op: "Equal", value: uid }],
              }),
            ]);
            const profile = profileResult.data?.List?.[0] as Record<string, unknown> | undefined;
            if (!profile) return null;

            const participantRows = (participantResult.data?.List ?? []) as Record<string, unknown>[];
            const confirmedRows = participantRows.filter((row) =>
              ["attended", "not_attended"].includes(String(row.attended ?? ""))
            );
            const attendedRows = confirmedRows.filter((row) => String(row.attended) === "attended");
            const attendanceRate =
              confirmedRows.length > 0 ? Math.round((attendedRows.length / confirmedRows.length) * 100) : null;

            const name = String(profile.full_name || profile.username || "Rider");
            const username = String(profile.username || "");
            const bikes = Array.isArray(profile.bikes_owned) ? (profile.bikes_owned as string[]) : [];

            const rider: ConnectedRider = {
              userId: uid,
              name,
              handle: username ? `@${username}` : "@rider",
              city: String(profile.city || ""),
              bike: bikes[0] ?? "No bike listed",
              attendanceRate,
              tint: tintForName(name),
            };
            return rider;
          })
        );
        if (!cancelled) {
          setRiders(results.filter((r): r is ConnectedRider => r !== null));
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Couldn't load your connections",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const trimmedQuery = query.trim().toLowerCase();
  const results = trimmedQuery
    ? riders.filter(
        (rider) =>
          rider.name.toLowerCase().includes(trimmedQuery) || rider.handle.toLowerCase().includes(trimmedQuery)
      )
    : riders;

  const handleInvite = async (rider: ConnectedRider) => {
    if (!user) return;
    try {
      const { error } = await window.ezsite.apis.tableCreate("notifications", {
        user_id: rider.userId,
        type: "general",
        message: `${formatRiderLabel(user.username, user.fullName)} invited you to "${rideTitle}"`,
        related_ride_id: Number(rideId),
        is_read: "no",
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      setInvitedIds((prev) => new Set(prev).add(rider.userId));
      toast({ title: "Invite sent", description: `${rider.name} was notified.` });
    } catch (err) {
      toast({
        title: "Couldn't send invite",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: "Copied ✓" });
    } catch {
      toast({ title: "Couldn't copy link", description: "Please copy it manually.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Invite to a ride", url: inviteLink });
      } catch {
        // Cancelling the native share sheet also rejects the promise; nothing to report.
      }
    } else {
      toast({ title: "Sharing not supported", description: "Use Copy link instead." });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-[#F0F0F0]">Invite a rider</h2>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#AAAAAA] transition-colors active:bg-[#222222]"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[#666666]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your connections..."
              className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {loading ? (
              <p className="py-4 text-center text-xs text-[#888888]">Loading your connections...</p>
            ) : results.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#888888]">
                {riders.length === 0
                  ? "You don't have any connections yet. Connect with riders to invite them."
                  : "No riders found. Share the link below to invite them."}
              </p>
            ) : (
              results.map((rider) => {
                const invited = invitedIds.has(rider.userId);
                return (
                  <div
                    key={rider.userId}
                    className="flex items-center gap-3 rounded-[14px] border border-[#2A2A2A] bg-[#151515] px-3.5 py-3"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: rider.tint.background, color: rider.tint.color }}
                    >
                      {getInitials(rider.name)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[13px] font-bold leading-tight text-[#F0F0F0]">
                        {formatHandle(rider.handle)}
                      </span>
                      <p className="text-xs leading-tight text-[#888888]">
                        {rider.attendanceRate != null ? `${rider.attendanceRate}% · ` : ""}
                        {rider.city}
                      </p>
                      <BikeTagPill label={rider.bike} />
                    </div>
                    <button
                      type="button"
                      disabled={invited}
                      onClick={() => handleInvite(rider)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                        invited
                          ? "cursor-default border border-[#3A3A3A] bg-[#2A2A2A] text-[#888888]"
                          : "border border-[#FF6600] text-[#FF6600] active:bg-[#FF6600]/10"
                      )}
                    >
                      {invited ? "Invited ✓" : "Invite"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <SectionDivider />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-[#AAAAAA]">Or share invite link</p>
            <input
              type="text"
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              Copy link
            </button>
          </div>

          <SectionDivider />

          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-xl border border-[#555555] py-3.5 text-sm font-bold text-[#F0F0F0] transition-transform active:scale-[0.98]"
          >
            Share via...
          </button>

          <p className="mt-4 text-center text-[11px] text-[#666666]">
            Riders who don't have MotoTriber will be asked to register when they open the link.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default InviteRiderSheet;
