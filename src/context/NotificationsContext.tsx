import { createContext, useContext, useState, ReactNode } from "react";

export type CaptainInviteStatus = "pending" | "accepted" | "declined";

export interface CaptainInviteNotification {
  id: string;
  clubId: string;
  clubName: string;
  riderId: string;
  riderName: string;
  status: CaptainInviteStatus;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: CaptainInviteNotification[];
  sendCaptainInvite: (clubId: string, clubName: string, riderId: string, riderName: string) => void;
  respondToCaptainInvite: (notificationId: string, status: "accepted" | "declined") => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<CaptainInviteNotification[]>([]);

  const sendCaptainInvite = (clubId: string, clubName: string, riderId: string, riderName: string) => {
    setNotifications((prev) => [
      {
        id: `n${Date.now()}`,
        clubId,
        clubName,
        riderId,
        riderName,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const respondToCaptainInvite = (notificationId: string, status: "accepted" | "declined") => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, status } : n)));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, sendCaptainInvite, respondToCaptainInvite }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
};
