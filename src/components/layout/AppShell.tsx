import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import ClubStatusBanner from "@/components/clubs/ClubStatusBanner";

const AppShell = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F0F0F0]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col pb-24">
        <ClubStatusBanner />
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppShell;
