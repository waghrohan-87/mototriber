import { NavLink } from "react-router-dom";
import { Home, Compass, PenLine, Users, UserRound, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discover", icon: Compass, end: false },
  { to: "/post", label: "Post", icon: PenLine, end: false },
  { to: "/clubs", label: "Clubs", icon: Users, end: false },
  { to: "/riders", label: "Riders", icon: UserRound, end: false },
  { to: "/profile", label: "Profile", icon: CircleUserRound, end: false },
];

const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[#333333] bg-[#111111]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "group relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors",
                  isActive ? "text-[#FF6600]" : "text-[#888888] hover:text-[#F0F0F0]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    <Icon
                      className="h-5 w-5 transition-transform duration-200 group-active:scale-90"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                      <span className="absolute -bottom-2 h-1 w-1 rounded-full bg-[#FF6600]" />
                    )}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
