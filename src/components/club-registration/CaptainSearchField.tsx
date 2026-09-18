import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";

export interface CaptainMatch {
  userId: number;
  fullName: string;
  username: string;
}

interface CaptainSearchFieldProps {
  query: string;
  onQueryChange: (value: string) => void;
  selectedUserId: number | null;
  onSelect: (match: CaptainMatch) => void;
}

const CaptainSearchField = ({ query, onQueryChange, selectedUserId, onSelect }: CaptainSearchFieldProps) => {
  const [matches, setMatches] = useState<CaptainMatch[]>([]);
  const [focused, setFocused] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setMatches([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [byUsername, byName] = await Promise.all([
          window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 6,
            Filters: [{ name: "username", op: "StringContains", value: trimmed }],
          }),
          window.ezsite.apis.tablePage("user_profiles", {
            PageNo: 1,
            PageSize: 6,
            Filters: [{ name: "full_name", op: "StringContains", value: trimmed }],
          }),
        ]);
        const rows = [
          ...((byUsername.data?.List ?? []) as Record<string, unknown>[]),
          ...((byName.data?.List ?? []) as Record<string, unknown>[]),
        ];
        const seen = new Map<number, CaptainMatch>();
        rows.forEach((row) => {
          const userId = Number(row.user_id);
          if (!seen.has(userId)) {
            seen.set(userId, {
              userId,
              fullName: String(row.full_name ?? ""),
              username: String(row.username ?? ""),
            });
          }
        });
        setMatches(Array.from(seen.values()).slice(0, 6));
      } catch {
        setMatches([]);
      } finally {
        setSearched(true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#666666]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search by username or name..."
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
        />
        {selectedUserId != null && <Check className="h-4 w-4 shrink-0 text-[#16A34A]" />}
      </div>

      {focused && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#333333] bg-[#1a1a1a] shadow-lg">
          {matches.map((match) => (
            <button
              key={match.userId}
              type="button"
              onMouseDown={() => onSelect(match)}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors active:bg-[#222222]"
            >
              <span className="truncate text-sm font-semibold text-[#F0F0F0]">
                {match.fullName || "Unnamed rider"}
              </span>
              <span className="truncate text-xs text-[#888888]">@{match.username}</span>
            </button>
          ))}
        </div>
      )}

      {focused && searched && query.trim() && matches.length === 0 && (
        <p className="mt-1.5 text-xs text-[#888888]">No matching riders found.</p>
      )}
    </div>
  );
};

export default CaptainSearchField;
