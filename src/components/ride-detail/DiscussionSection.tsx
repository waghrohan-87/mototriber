import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CurrentUser } from "@/hooks/useCurrentUser";
import CommentItem from "@/components/ride-detail/CommentItem";
import CommentComposer from "@/components/ride-detail/CommentComposer";

interface CommentRow {
  id: number;
  userId: number;
  userName: string;
  text: string;
  isPinned: boolean;
  pinType: "edit" | "cancel" | "claim" | "dropout" | null;
  createdAt: string;
}

interface DiscussionSectionProps {
  rideId: number;
  isCancelled: boolean;
  canAccess: boolean;
  currentUser: CurrentUser | null;
  lockedLabel: string;
  lockedDisabled: boolean;
  onRequestToJoin: () => void;
}

const DiscussionSection = ({
  rideId,
  isCancelled,
  canAccess,
  currentUser,
  lockedLabel,
  lockedDisabled,
  onRequestToJoin,
}: DiscussionSectionProps) => {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage("ride_comments", {
        PageNo: 1,
        PageSize: 500,
        Filters: [{ name: "ride_id", op: "Equal", value: rideId }],
      });
      if (error) throw new Error(error);
      const rows = (data?.List ?? []) as Record<string, unknown>[];

      const uniqueUserIds = Array.from(new Set(rows.map((r) => Number(r.user_id))));
      const nameByUserId = new Map<number, string>();
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const { data: profileData } = await window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "user_id", op: "Equal", value: uid }],
          });
          const name = String(
            (profileData?.List?.[0] as Record<string, unknown> | undefined)?.full_name ?? `Rider #${uid}`
          );
          nameByUserId.set(uid, name);
        })
      );

      const mapped: CommentRow[] = rows.map((r) => ({
        id: Number(r.ID ?? r.id),
        userId: Number(r.user_id),
        userName: nameByUserId.get(Number(r.user_id)) ?? `Rider #${r.user_id}`,
        text: String(r.comment_text ?? ""),
        isPinned: String(r.is_pinned) === "yes",
        pinType: (r.pin_type as "edit" | "cancel" | "claim" | "dropout" | null) ?? null,
        createdAt: String(r.created_at ?? ""),
      }));

      const pinned = mapped
        .filter((c) => c.isPinned)
        .sort((a, b) => {
          if (a.pinType !== b.pinType) {
            if (a.pinType === "cancel") return -1;
            if (b.pinType === "cancel") return 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      const regular = mapped
        .filter((c) => !c.isPinned)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setComments([...pinned, ...regular]);
    } catch (err) {
      toast({
        title: "Couldn't load discussion",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, canAccess]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser || sending) return;
    setSending(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate("ride_comments", {
        ride_id: rideId,
        user_id: currentUser.userId,
        comment_text: trimmed,
        is_pinned: "no",
        pin_type: null,
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      setInput("");
      await loadComments();
    } catch (err) {
      toast({
        title: "Couldn't post comment",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b border-[#2A2A2A] px-5 py-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">Discussion</h2>

      {!canAccess ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-5 py-8 text-center">
          <Lock className="h-6 w-6 text-[#666666]" />
          <p className="text-sm text-[#888888]">Discussion is only available to riders on this ride</p>
          <button
            type="button"
            onClick={onRequestToJoin}
            disabled={lockedDisabled}
            className="rounded-full bg-[#FF6600] px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {lockedLabel}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {loading ? (
              <p className="text-xs text-[#888888]">Loading discussion...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-[#888888]">No comments yet. Be the first to say something.</p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  userName={c.userName}
                  text={c.text}
                  createdAt={c.createdAt}
                  isPinned={c.isPinned}
                  pinType={c.pinType}
                />
              ))
            )}
          </div>

          {!isCancelled && <CommentComposer value={input} onChange={setInput} onSend={handleSend} sending={sending} />}
        </>
      )}
    </div>
  );
};

export default DiscussionSection;
