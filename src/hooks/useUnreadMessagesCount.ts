import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";
import { fetchUnreadMessagesCount } from "@/lib/messaging";

export const useUnreadMessagesCount = () => {
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
        const next = await fetchUnreadMessagesCount(user.userId);
        if (!cancelled) setCount(next);
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
