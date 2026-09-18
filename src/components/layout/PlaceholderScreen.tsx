import { LucideIcon } from "lucide-react";
import TopBar from "@/components/layout/TopBar";

interface PlaceholderScreenProps {
  icon: LucideIcon;
  title: string;
}

const PlaceholderScreen = ({ icon: Icon, title }: PlaceholderScreenProps) => {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#333333] bg-[#222222]">
          <Icon className="h-8 w-8 text-[#888888]" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[#888888]">
          {title} is coming soon
        </p>
      </div>
    </div>
  );
};

export default PlaceholderScreen;
