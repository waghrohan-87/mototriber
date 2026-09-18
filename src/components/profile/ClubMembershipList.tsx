import { UserClubSummary } from "@/hooks/useUserClubs";

interface ClubMembershipListProps {
  clubs: UserClubSummary[];
  loading: boolean;
}

const ClubMembershipList = ({ clubs, loading }: ClubMembershipListProps) => {
  if (loading) {
    return <p className="py-3 text-center text-xs text-[#888888]">Loading clubs...</p>;
  }

  if (clubs.length === 0) {
    return <p className="py-3 text-center text-xs text-[#888888]">Not a member of any clubs yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {clubs.map((club) => (
        <div
          key={club.id}
          className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1a1a1a] px-3 py-2.5"
        >
          {club.logoUrl ? (
            <img
              src={club.logoUrl}
              alt={club.name}
              className="h-9 w-9 shrink-0 rounded-lg border border-[#333333] object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2A2A2A] text-xs font-bold text-[#888888]">
              {club.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-[#F0F0F0]">{club.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ClubMembershipList;
