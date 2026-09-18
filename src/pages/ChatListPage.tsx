import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { avatarTintForName } from "@/lib/avatarTint";
import { AvatarTint } from "@/components/riders/RiderCard";
import {
  ConversationRecord,
  fetchConversationsForUser,
  hasUnreadMessagesInConversation,
  otherUserIdInConversation,
} from "@/lib/messaging";

const TINT_STYLES: Record<AvatarTint, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface ChatListItem {
  conversationId: number;
  otherUserId: number;
  name: string;
  handle: string;
  avatarTint: AvatarTint;
  lastMessageText: string;
  lastMessageAt: string | null;
  hasUnread: boolean;
}

const ChatListPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [items, setItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const conversations = await fetchConversationsForUser(user.userId);
      const sorted = [...conversations].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      const nextItems = await Promise.all(
        sorted.map(async (conversation: ConversationRecord) => {
          const otherUserId = otherUserIdInConversation(conversation, user.userId);
          const [profileResult, hasUnread] = await Promise.all([
            window.ezsite.apis.tablePage("user_profiles", {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: "user_id", op: "Equal", value: otherUserId }],
            }),
            hasUnreadMessagesInConversation(conversation.id, otherUserId),
          ]);
          const row = profileResult.data?.List?.[0] as Record<string, unknown> | undefined;
          const name = String(row?.full_name || row?.username || "Rider");
          const username = String(row?.username || "");

          return {
            conversationId: conversation.id,
            otherUserId,
            name,
            handle: username ? `@${username}` : "@rider",
            avatarTint: avatarTintForName(name),
            lastMessageText: conversation.lastMessageText,
            lastMessageAt: conversation.lastMessageAt,
            hasUnread,
          };
        })
      );

      setItems(nextItems);
    } catch (err) {
      toast({
        title: "Couldn't load messages",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
            onClick={() => navigate("/", { replace: true })}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-[#F0F0F0]">Messages</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!loading && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <MessageCircle className="h-8 w-8 text-[#666666]" strokeWidth={1.5} />
              <p className="text-sm text-[#888888]">No messages yet. Connect with riders to start chatting.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <button
                  key={item.conversationId}
                  type="button"
                  onClick={() => navigate(`/messages/${item.conversationId}`)}
                  className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] px-3.5 py-3 text-left transition-colors active:border-[#FF6600]/40"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                      TINT_STYLES[item.avatarTint]
                    )}
                  >
                    {getInitials(item.name)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-[13px] font-bold text-[#F0F0F0]">{item.handle}</h3>
                      {item.lastMessageAt && (
                        <span className="shrink-0 text-[10px] text-[#666666]">
                          {formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[#888888]">
                      {item.lastMessageText || "Say hello 👋"}
                    </p>
                  </div>
                  {item.hasUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF6600]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatListPage;
