import { useEffect, useState } from "react";

export interface MyRegisteredClub {
  id: number;
  name: string;
  status: string;
}

export const useMyRegisteredClub = (userId: number | null | undefined) => {
  const [club, setClub] = useState<MyRegisteredClub | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setClub(null);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await window.ezsite.apis.tablePage("clubs", {
          PageNo: 1,
          PageSize: 1,
          OrderByField: "ID",
          IsAsc: false,
          Filters: [{ name: "admin_user_id", op: "Equal", value: userId }],
        });
        if (error) throw new Error(error);
        const row = data?.List?.[0] as Record<string, unknown> | undefined;
        if (!cancelled) {
          setClub(
            row
              ? {
                  id: Number(row.ID ?? row.id),
                  name: String(row.name ?? ""),
                  status: String(row.status ?? "pending"),
                }
              : null
          );
        }
      } catch {
        if (!cancelled) setClub(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { club, loading };
};
