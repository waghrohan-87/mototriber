import { cn } from "@/lib/utils";
import { RIDING_INTERESTS, RidingInterest } from "./ridingInterests";

interface InterestSelectGridProps {
  selected: RidingInterest[];
  onToggle: (interest: RidingInterest) => void;
}

const InterestSelectGrid = ({ selected, onToggle }: InterestSelectGridProps) => (
  <div className="grid grid-cols-2 gap-2">
    {RIDING_INTERESTS.map((interest) => {
      const active = selected.includes(interest);
      return (
        <button
          key={interest}
          type="button"
          onClick={() => onToggle(interest)}
          className={cn(
            "rounded-xl border px-3 py-3 text-xs font-bold transition-colors",
            active
              ? "border-[#FF6600] bg-[#FF6600]/15 text-[#FF6600]"
              : "border-[#333333] bg-[#222222] text-[#888888]"
          )}
        >
          {interest}
        </button>
      );
    })}
  </div>
);

export default InterestSelectGrid;
