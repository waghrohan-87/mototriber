export type ConnectionRowStatus = "pending" | "connected" | "declined";

export interface ConnectionRecord {
  id: number;
  requesterUserId: number;
  targetUserId: number;
  status: ConnectionRowStatus;
  createdAt: string;
  respondedAt: string | null;
}

export type ConnectButtonState = "connect" | "requested" | "incoming" | "connected";

const mapConnectionRow = (row: Record<string, unknown>): ConnectionRecord => ({
  id: Number(row.ID ?? row.id),
  requesterUserId: Number(row.requester_user_id),
  targetUserId: Number(row.target_user_id),
  status: (String(row.status || "pending") as ConnectionRowStatus),
  createdAt: String(row.created_at || ""),
  respondedAt: row.responded_at ? String(row.responded_at) : null,
});

export const fetchConnectionsForUser = async (userId: number): Promise<ConnectionRecord[]> => {
  const [asRequester, asTarget] = await Promise.all([
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 500,
      Filters: [{ name: "requester_user_id", op: "Equal", value: userId }],
    }),
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 500,
      Filters: [{ name: "target_user_id", op: "Equal", value: userId }],
    }),
  ]);
  if (asRequester.error) throw new Error(asRequester.error);
  if (asTarget.error) throw new Error(asTarget.error);

  const rows = [
    ...((asRequester.data?.List ?? []) as Record<string, unknown>[]),
    ...((asTarget.data?.List ?? []) as Record<string, unknown>[]),
  ];
  return rows.map(mapConnectionRow);
};

export const latestConnectionMap = (
  records: ConnectionRecord[],
  userId: number
): Map<number, ConnectionRecord> => {
  const map = new Map<number, ConnectionRecord>();
  records.forEach((record) => {
    const otherUserId = record.requesterUserId === userId ? record.targetUserId : record.requesterUserId;
    const existing = map.get(otherUserId);
    if (!existing || new Date(record.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
      map.set(otherUserId, record);
    }
  });
  return map;
};

export const resolveConnectionState = (
  currentUserId: number,
  record: ConnectionRecord | undefined
): ConnectButtonState => {
  if (!record || record.status === "declined") return "connect";
  if (record.status === "connected") return "connected";
  return record.requesterUserId === currentUserId ? "requested" : "incoming";
};

export const sendConnectRequest = async (
  requesterUserId: number,
  requesterLabel: string,
  targetUserId: number
): Promise<void> => {
  const nowIso = new Date().toISOString();
  const { error } = await window.ezsite.apis.tableCreate("connections", {
    requester_user_id: requesterUserId,
    target_user_id: targetUserId,
    status: "pending",
    created_at: nowIso,
  });
  if (error) throw new Error(error);

  const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: targetUserId,
    type: "connect_request",
    message: `${requesterLabel} wants to connect`,
    is_read: "no",
    created_at: nowIso,
  });
  if (notifyError) throw new Error(notifyError);
};

export const acceptConnectionRequest = async (
  record: ConnectionRecord,
  accepterLabel: string
): Promise<void> => {
  const nowIso = new Date().toISOString();
  const { error } = await window.ezsite.apis.tableUpdate("connections", {
    ID: record.id,
    status: "connected",
    responded_at: nowIso,
  });
  if (error) throw new Error(error);

  const { error: notifyError } = await window.ezsite.apis.tableCreate("notifications", {
    user_id: record.requesterUserId,
    type: "general",
    message: `${accepterLabel} accepted your connection request`,
    is_read: "no",
    created_at: nowIso,
  });
  if (notifyError) throw new Error(notifyError);
};

export const declineConnectionRequest = async (record: ConnectionRecord): Promise<void> => {
  const { error } = await window.ezsite.apis.tableUpdate("connections", {
    ID: record.id,
    status: "declined",
    responded_at: new Date().toISOString(),
  });
  if (error) throw new Error(error);
};

export const fetchConnectionsCount = async (userId: number): Promise<number> => {
  const [asRequester, asTarget] = await Promise.all([
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "requester_user_id", op: "Equal", value: userId },
        { name: "status", op: "Equal", value: "connected" },
      ],
    }),
    window.ezsite.apis.tablePage("connections", {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "target_user_id", op: "Equal", value: userId },
        { name: "status", op: "Equal", value: "connected" },
      ],
    }),
  ]);
  if (asRequester.error) throw new Error(asRequester.error);
  if (asTarget.error) throw new Error(asTarget.error);
  return (asRequester.data?.VirtualCount ?? 0) + (asTarget.data?.VirtualCount ?? 0);
};

export const fetchConnectedUserIds = async (userId: number): Promise<number[]> => {
  const records = await fetchConnectionsForUser(userId);
  const map = latestConnectionMap(records, userId);
  const connectedIds: number[] = [];
  map.forEach((record, otherUserId) => {
    if (record.status === "connected") connectedIds.push(otherUserId);
  });
  return connectedIds;
};

export const formatRiderLabel = (username: string | undefined, fullName: string | undefined): string => {
  if (username) return `@${username}`;
  if (fullName) return fullName;
  return "A rider";
};
