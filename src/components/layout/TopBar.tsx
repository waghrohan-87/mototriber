import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle } from "lucide-react";
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

interface TopBarProps {
  right?: ReactNode;
  hasUnreadNotifications?: boolean;
}

const TopBar = ({ right, hasUnreadNotifications }: TopBarProps) => {
  const navigate = useNavigate();
  const unreadNotificationsCount = useUnreadNotificationsCount();
  const unreadMessagesCount = useUnreadMessagesCount();
  const unreadNotifications = hasUnreadNotifications ?? unreadNotificationsCount > 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#333333] bg-[#111111] px-5">
      <div className="flex flex-col justify-center gap-0.5">
        <span
          style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: "22px" }}
          className="leading-none tracking-wide"
        >
          <span className="text-white">MOTO</span>
          <span className="text-[#FF6600]">TRIBER</span>
        </span>
        <span
          style={{ fontFamily: "system-ui, sans-serif", fontSize: "10px", fontWeight: 400 }}
          className="leading-none text-[#888888]"
        >
          Find your tribe. Find your ride.
        </span>
      </div>
      <div className="flex items-center gap-1">
        {right}
        <button
          type="button"
          onClick={() => navigate("/messages")}
          aria-label="Messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#888888] transition-colors active:bg-[#222222]"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF6600] px-1 text-[9px] font-bold leading-none text-white">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#888888] transition-colors active:bg-[#222222]"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF6600] px-1 text-[9px] font-bold leading-none text-white">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
