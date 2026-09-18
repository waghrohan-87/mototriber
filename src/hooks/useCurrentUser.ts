import { useEffect, useState } from "react";

export interface CurrentUser {
  userId: number;
  authName: string;
  authEmail: string;
  fullName: string;
  username: string;
  city: string;
  isAdmin: boolean;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: userInfo, error } = await window.ezsite.apis.getUserInfo();
        if (error || !userInfo) throw new Error(error || "Not signed in");

        const { data: profiles } = await window.ezsite.apis.tablePage("user_profiles", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "user_id", op: "Equal", value: userInfo.ID }],
        });
        const profile = profiles?.List?.[0];

        const roles = String(userInfo.Roles || "")
          .split(",")
          .map((role: string) => role.trim())
          .filter(Boolean);

        if (!cancelled) {
          setUser({
            userId: userInfo.ID,
            authName: userInfo.Name,
            authEmail: userInfo.Email,
            fullName: profile?.full_name || userInfo.Name || "",
            username: profile?.username || "",
            city: profile?.city || "",
            isAdmin: roles.includes("Administrator"),
          });
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
};
