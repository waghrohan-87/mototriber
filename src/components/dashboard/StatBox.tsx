import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatBoxProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  muted?: boolean;
  mutedText?: string;
  className?: string;
}

const StatBox = ({ label, value, sublabel, muted, mutedText, className }: StatBoxProps) => {
  if (muted) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#333333] bg-[#161616] px-3 py-4 text-center", className)}>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#666666]">{label}</span>
        <span className="text-xs leading-snug text-[#888888]">{mutedText}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] px-3 py-4 text-center", className)}>
      <span className="text-lg font-bold text-[#F0F0F0]">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-[#888888]">{label}</span>
      {sublabel}
    </div>
  );
};

export default StatBox;
