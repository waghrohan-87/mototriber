import { cn } from "@/lib/utils";

interface FilterChipsProps {
  filters: string[];
  active: string;
  onChange: (filter: string) => void;
}

const FilterChips = ({ filters, active, onChange }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-[#FF6600] bg-[#FF6600] text-white"
                : "border-[#555555] bg-[#1a1a1a] text-[#888888] hover:text-[#F0F0F0]"
            )}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
