import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";

export const useUnreadNotificationsCount = () => {
  const { user } = useCurrentUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage("notifications", {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            { name: "user_id", op: "Equal", value: user.userId },
            { name: "is_read", op: "Equal", value: "no" },
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
  }, [user?.userId]);

  return count;
};
