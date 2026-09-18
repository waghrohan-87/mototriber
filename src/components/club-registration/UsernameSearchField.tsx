import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { useRidersDirectory } from "@/context/RidersDirectoryContext";
import { isRegisteredHandle, normalizeHandle } from "./isRegisteredHandle";

interface UsernameSearchFieldProps {
  value: string;
  onChange: (handle: string) => void;
  placeholder?: string;
}

const UsernameSearchField = ({ value, onChange, placeholder }: UsernameSearchFieldProps) => {
  const { riders } = useRidersDirectory();
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const query = normalizeHandle(value);
    if (!query) return [];
    return riders
      .filter((r) => normalizeHandle(r.handle).includes(query) || r.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [riders, value]);

  const isVerified = isRegisteredHandle(riders, value);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#666666]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder ?? "Search by username..."}
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
        />
        {isVerified && <Check className="h-4 w-4 shrink-0 text-[#16A34A]" />}
      </div>

      {focused && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#333333] bg-[#1a1a1a] shadow-lg">
          {matches.map((rider) => (
            <button
              key={rider.id}
              type="button"
              onMouseDown={() => onChange(rider.handle)}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors active:bg-[#222222]"
            >
              <span className="truncate text-sm font-semibold text-[#F0F0F0]">{rider.name}</span>
              <span className="truncate text-xs text-[#888888]">{rider.handle}</span>
            </button>
          ))}
        </div>
      )}

      {value.trim() && !isVerified && (
        <p className="mt-1.5 text-xs text-[#888888]">No matching MotoTriber rider account found.</p>
      )}
    </div>
  );
};

export default UsernameSearchField;
