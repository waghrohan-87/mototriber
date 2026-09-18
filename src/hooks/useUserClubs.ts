import { useEffect, useState } from "react";

export interface UserClubSummary {
  id: number;
  name: string;
  logoUrl: string | null;
}

export const useUserClubs = (userId: number | null | undefined, enabled: boolean) => {
  const [clubs, setClubs] = useState<UserClubSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: memberRows, error: memberError } = await window.ezsite.apis.tablePage("club_members", {
          PageNo: 1,
          PageSize: 200,
          Filters: [{ name: "user_id", op: "Equal", value: userId }],
        });
        if (memberError) throw new Error(memberError);

        const clubIds = Array.from(
          new Set(((memberRows?.List ?? []) as Record<string, unknown>[]).map((row) => Number(row.club_id)))
        );

        if (clubIds.length === 0) {
          if (!cancelled) setClubs([]);
          return;
        }

        const clubResults = await Promise.all(
          clubIds.map((clubId) =>
            window.ezsite.apis.tablePage("clubs", {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: "ID", op: "Equal", value: clubId }],
            })
          )
        );

        const nextClubs: UserClubSummary[] = clubResults
          .map((res) => res.data?.List?.[0] as Record<string, unknown> | undefined)
          .filter((row): row is Record<string, unknown> => Boolean(row))
          .map((row) => ({
            id: Number(row.ID ?? row.id),
            name: String(row.name ?? ""),
            logoUrl: (row.logo_url as string) || null,
          }));

        if (!cancelled) setClubs(nextClubs);
      } catch {
        if (!cancelled) setClubs([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return { clubs, loading, loaded };
};
