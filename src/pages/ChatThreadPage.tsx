import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { avatarTintForName } from "@/lib/avatarTint";
import { AvatarTint } from "@/components/riders/RiderCard";
import { formatRiderLabel } from "@/lib/connections";
import {
  ConversationRecord,
  MessageRecord,
  areUsersConnected,
  fetchConversation,
  fetchMessagesForConversation,
  markMessagesRead,
  otherUserIdInConversation,
  sendMessage,
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

interface OtherUser {
  userId: number;
  name: string;
  handle: string;
  avatarTint: AvatarTint;
}

const ChatThreadPage = () => {
  const { id } = useParams<{ id: string }>();
  const conversationId = id ? Number(id) : NaN;
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardError, setGuardError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user || !Number.isFinite(conversationId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setGuardError(null);
    try {
      const conv = await fetchConversation(conversationId);
      if (!conv) {
        setGuardError("This conversation could not be found.");
        return;
      }
      const otherUserId = otherUserIdInConversation(conv, user.userId);
      const connected = await areUsersConnected(user.userId, otherUserId);
      if (!connected) {
        setGuardError("You can only message riders you're connected with.");
        return;
      }
      setConversation(conv);

      const { data: profileData, error: profileError } = await window.ezsite.apis.tablePage("user_profiles", {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: otherUserId }],
      });
      if (profileError) throw new Error(profileError);
      const row = profileData?.List?.[0] as Record<string, unknown> | undefined;
      const name = String(row?.full_name || row?.username || "Rider");
      const username = String(row?.username || "");
      setOtherUser({
        userId: otherUserId,
        name,
        handle: username ? `@${username}` : "@rider",
        avatarTint: avatarTintForName(name),
      });

      const msgs = await fetchMessagesForConversation(conversationId);
      setMessages(msgs);

      await markMessagesRead(conversationId, otherUserId);
      setMessages((prev) => prev.map((m) => (m.senderUserId === otherUserId ? { ...m, isRead: true } : m)));
    } catch (err) {
      toast({
        title: "Couldn't load this conversation",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !otherUser || !conversation) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(
        conversation.id,
        user.userId,
        otherUser.userId,
        formatRiderLabel(user.username, user.fullName),
        text
      );
      setDraft("");
      const msgs = await fetchMessagesForConversation(conversation.id);
      setMessages(msgs);
    } catch (err) {
      toast({
        title: "Couldn't send message",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !sending) {
      e.preventDefault();
      handleSend();
    }
  };

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
            onClick={() => navigate("/messages", { replace: true })}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {otherUser && (
            <button
              type="button"
              onClick={() => navigate(`/rider/${otherUser.userId}`)}
              className="flex items-center gap-2 text-left transition-opacity active:opacity-70"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                  TINT_STYLES[otherUser.avatarTint]
                )}
              >
                {getInitials(otherUser.name)}
              </span>
              <span className="text-sm font-bold text-[#F0F0F0]">{otherUser.name}</span>
            </button>
          )}
        </div>

        {guardError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-sm text-[#888888]">{guardError}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!loading && messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#888888]">
                  No messages yet. Say hello 👋
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((message) => {
                    const isMine = message.senderUserId === user?.userId;
                    return (
                      <div
                        key={message.id}
                        className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug",
                            isMine
                              ? "rounded-br-sm bg-[#FF6600] text-white"
                              : "rounded-bl-sm bg-[#2A2A2A] text-[#F0F0F0]"
                          )}
                        >
                          {message.messageText}
                        </div>
                        <span className="px-1 text-[10px] text-[#666666]">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-[#333333] bg-[#111111] px-3 py-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={sending}
                className="flex-1 rounded-full border border-[#333333] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6600] text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatThreadPage;
