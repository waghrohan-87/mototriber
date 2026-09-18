import { useNavigate } from "react-router-dom";
import { useMyRegisteredClub } from "@/hooks/useMyRegisteredClub";

interface MyClubCardProps {
  userId: number | null | undefined;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600]",
  approved: "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]",
  rejected: "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const MyClubCard = ({ userId }: MyClubCardProps) => {
  const navigate = useNavigate();
  const { club, loading } = useMyRegisteredClub(userId);

  if (loading || !club) return null;

  return (
    <div className="mx-4 mt-5 flex flex-col gap-3 rounded-[14px] border border-[#2A2A2A] bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#888888]">My Club</span>
          <h3 className="text-sm font-bold text-[#F0F0F0]">{club.name}</h3>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            STATUS_STYLES[club.status] ?? STATUS_STYLES.pending
          }`}
        >
          {STATUS_LABELS[club.status] ?? "Pending review"}
        </span>
      </div>

      {club.status === "pending" && (
        <p className="text-xs text-[#888888]">Your club is under review. We'll notify you once it's approved.</p>
      )}
      {club.status === "rejected" && (
        <p className="text-xs text-[#888888]">Your club application was not approved.</p>
      )}
      {club.status === "approved" && (
        <button
          type="button"
          onClick={() => navigate(`/club/${club.id}/admin`)}
          className="w-full rounded-xl bg-[#FF6600] py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
        >
          Manage club
        </button>
      )}
    </div>
  );
};

export default MyClubCard;
