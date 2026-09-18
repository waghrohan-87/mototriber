export interface ConversationRecord {
  id: number;
  userAId: number;
  userBId: number;
  lastMessageText: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessageRecord {
  id: number;
  conversationId: number;
  senderUserId: number;
  messageText: string;
  isRead: boolean;
  createdAt: string;
}

const mapConversationRow = (row: Record<string, unknown>): ConversationRecord => ({
  id: Number(row.ID ?? row.id),
  userAId: Number(row.user_a_id),
  userBId: Number(row.user_b_id),
  lastMessageText: String(row.last_message_text ?? ""),
  lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
  createdAt: String(row.created_at ?? ""),
});

const mapMessageRow = (row: Record<string, unknown>): MessageRecord => ({
  id: Number(row.ID ?? row.id),
  conversationId: Number(row.conversation_id),
  senderUserId: Number(row.sender_user_id),
  messageText: String(row.message_text ?? ""),
  isRead: String(row.is_read) === "yes",
  createdAt: String(row.created_at ?? ""),
});

export const otherUserIdInConversation = (conversation: ConversationRecord, userId: number): number =>
  conversation.userAId === userId ? conversation.userBId : conversation.userAId;

export const areUsersConnected = async (userIdA: number, userIdB: number): Promise<boolean> => {
  const [forward, backward] = await Promise.all([
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "requester_user_id", op: "Equal", value: userIdA },
        { name: "target_user_id", op: "Equal", value: userIdB },
        { name: "status", op: "Equal", value: "connected" },
      ],
    }),
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "requester_user_id", op: "Equal", value: userIdB },
        { name: "target_user_id", op: "Equal", value: userIdA },
        { name: "status", op: "Equal", value: "connected" },
      ],
    }),
  ]);
  if (forward.error) throw new Error(forward.error);
  if (backward.error) throw new Error(backward.error);
  return (forward.data?.VirtualCount ?? 0) > 0 || (backward.data?.VirtualCount ?? 0) > 0;
};

export const fetchConversationsForUser = async (userId: number): Promise<ConversationRecord[]> => {
  const [asA, asB] = await Promise.all([
    window.ezsite.apis.tablePage("conversations", {
      PageNo: 1,
      PageSize: 200,
      Filters: [{ name: "user_a_id", op: "Equal", value: userId }],
    }),
    window.ezsite.apis.tablePage("conversations", {
      PageNo: 1,
      PageSize: 200,
      Filters: [{ name: "user_b_id", op: "Equal", value: userId }],
    }),
  ]);
  if (asA.error) throw new Error(asA.error);
  if (asB.error) throw new Error(asB.error);

  const rows = [
    ...((asA.data?.List ?? []) as Record<string, unknown>[]),
    ...((asB.data?.List ?? []) as Record<string, unknown>[]),
  ];
  return rows.map(mapConversationRow);
};

export const findOrCreateConversation = async (
  currentUserId: number,
  otherUserId: number
): Promise<ConversationRecord> => {
  const connected = await areUsersConnected(currentUserId, otherUserId);
  if (!connected) {
    throw new Error("You can only message riders you're connected with.");
  }

  const [asRequester, asTarget] = await Promise.all([
    window.ezsite.apis.tablePage("conversations", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "user_a_id", op: "Equal", value: currentUserId },
        { name: "user_b_id", op: "Equal", value: otherUserId },
      ],
    }),
    window.ezsite.apis.tablePage("conversations", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "user_a_id", op: "Equal", value: otherUserId },
        { name: "user_b_id", op: "Equal", value: currentUserId },
      ],
    }),
  ]);
  if (asRequester.error) throw new Error(asRequester.error);
  if (asTarget.error) throw new Error(asTarget.error);

  const existing = (asRequester.data?.List?.[0] ?? asTarget.data?.List?.[0]) as
    | Record<string, unknown>
    | undefined;
  if (existing) return mapConversationRow(existing);

  const nowIso = new Date().toISOString();
  const { error: createError } = await window.ezsite.apis.tableCreate("conversations", {
    user_a_id: currentUserId,
    user_b_id: otherUserId,
    last_message_text: "",
    last_message_at: null,
    created_at: nowIso,
  });
  if (createError) throw new Error(createError);

  const { data: createdData, error: fetchError } = await window.ezsite.apis.tablePage("conversations", {
    PageNo: 1,
    PageSize: 1,
    OrderByField: "ID",
    IsAsc: false,
    Filters: [
      { name: "user_a_id", op: "Equal", value: currentUserId },
      { name: "user_b_id", op: "Equal", value: otherUserId },
    ],
  });
  if (fetchError) throw new Error(fetchError);
  const createdRow = createdData?.List?.[0] as Record<string, unknown> | undefined;
  if (!createdRow) throw new Error("Couldn't start the conversation.");
  return mapConversationRow(createdRow);
};

export const fetchConversation = async (conversationId: number): Promise<ConversationRecord | null> => {
  const { data, error } = await window.ezsite.apis.tablePage("conversations", {
    PageNo: 1,
    PageSize: 1,
    Filters: [{ name: "ID", op: "Equal", value: conversationId }],
  });
  if (error) throw new Error(error);
  const row = data?.List?.[0] as Record<string, unknown> | undefined;
  return row ? mapConversationRow(row) : null;
};

export const fetchMessagesForConversation = async (conversationId: number): Promise<MessageRecord[]> => {
  const { data, error } = await window.ezsite.apis.tablePage("messages", {
    PageNo: 1,
    PageSize: 500,
    OrderByField: "created_at",
    IsAsc: true,
    Filters: [{ name: "conversation_id", op: "Equal", value: conversationId }],
  });
  if (error) throw new Error(error);
  return ((data?.List ?? []) as Record<string, unknown>[]).map(mapMessageRow);
};

export const sendMessage = async (
  conversationId: number,
  senderUserId: number,
  recipientUserId: number,
  senderLabel: string,
  text: string
): Promise<void> => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message can't be empty.");

  const nowIso = new Date().toISOString();
  const { error: messageError } = await window.ezsite.apis.tableCreate("messages", {
    conversation_id: conversationId,
    sender_user_id: senderUserId,
    message_text: trimmed,
    is_read: "no",
    created_at: nowIso,
  });
  if (messageError) throw new Error(messageError);

  const { error: conversationError } = await window.ezsite.apis.tableUpdate("conversations", {
    ID: conversationId,
    last_message_text: trimmed,
    last_message_at: nowIso,
  });
  if (conversationError) throw new Error(conversationError);

  const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: recipientUserId,
    type: "general",
    message: `New message from ${senderLabel}`,
    is_read: "no",
    created_at: nowIso,
  });
  if (notifyError) throw new Error(notifyError);
};

export const markMessagesRead = async (conversationId: number, otherUserId: number): Promise<void> => {
  const { data, error } = await window.ezsite.apis.tablePage("messages", {
    PageNo: 1,
    PageSize: 500,
    Filters: [
      { name: "conversation_id", op: "Equal", value: conversationId },
      { name: "sender_user_id", op: "Equal", value: otherUserId },
      { name: "is_read", op: "Equal", value: "no" },
    ],
  });
  if (error) throw new Error(error);
  const rows = (data?.List ?? []) as Record<string, unknown>[];
  await Promise.all(
    rows.map((row) =>
      window.ezsite.apis.tableUpdate("messages", { ID: Number(row.ID ?? row.id), is_read: "yes" })
    )
  );
};

export const hasUnreadMessagesInConversation = async (
  conversationId: number,
  otherUserId: number
): Promise<boolean> => {
  const { data, error } = await window.ezsite.apis.tablePage("messages", {
    PageNo: 1,
    PageSize: 1,
    Filters: [
      { name: "conversation_id", op: "Equal", value: conversationId },
      { name: "sender_user_id", op: "Equal", value: otherUserId },
      { name: "is_read", op: "Equal", value: "no" },
    ],
  });
  if (error) throw new Error(error);
  return (data?.VirtualCount ?? 0) > 0;
};

export const fetchUnreadMessagesCount = async (userId: number): Promise<number> => {
  const conversations = await fetchConversationsForUser(userId);
  if (conversations.length === 0) return 0;

  const counts = await Promise.all(
    conversations.map(async (conversation) => {
      const otherUserId = otherUserIdInConversation(conversation, userId);
      const { data, error } = await window.ezsite.apis.tablePage("messages", {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: "conversation_id", op: "Equal", value: conversation.id },
          { name: "sender_user_id", op: "Equal", value: otherUserId },
          { name: "is_read", op: "Equal", value: "no" },
        ],
      });
      if (error) return 0;
      return data?.VirtualCount ?? 0;
    })
  );
  return counts.reduce((sum, count) => sum + count, 0);
};
