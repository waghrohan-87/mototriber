import { Calendar } from "lucide-react";

interface AttentionRowProps {
  title: string;
  rideDate: string;
  onConfirm: () => void;
}

const AttentionRow = ({ title, rideDate, onConfirm }: AttentionRowProps) => (
  <div className="flex items-center gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] px-3.5 py-3">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <h3 className="truncate text-sm font-bold leading-tight text-[#F0F0F0]">{title}</h3>
      <span className="flex items-center gap-1.5 text-xs text-[#888888]">
        <Calendar className="h-3.5 w-3.5" />
        {rideDate}
      </span>
    </div>
    <button
      type="button"
      onClick={onConfirm}
      className="shrink-0 rounded-full border border-[#FF6600] px-3 py-1.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-95"
    >
      Confirm attendance
    </button>
  </div>
);

export default AttentionRow;
