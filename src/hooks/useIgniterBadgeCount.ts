import { useEffect, useState } from "react";

export const useIgniterBadgeCount = (userId: number | null | undefined) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage("rider_badges_earned", {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            { name: "user_id", op: "Equal", value: userId },
            { name: "badge_name", op: "Equal", value: "Igniter" },
          ],
        });
        if (error) throw new Error(error);
        if (!cancelled) setCount(data?.VirtualCount ?? 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return count;
};
