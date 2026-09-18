import { format } from "date-fns";

interface PendingClub {
  id: number;
  name: string;
  city: string;
  whatsappNumber: string;
  createdAt: string;
  adminName: string;
  adminPhone: string;
}

interface PendingClubRowProps {
  club: PendingClub;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-[#888888]">{label}</span>
    <span className="max-w-[65%] truncate text-right font-semibold text-[#F0F0F0]">{value || "—"}</span>
  </div>
);

const PendingClubRow = ({ club, busy, onApprove, onReject }: PendingClubRowProps) => (
  <div className="flex flex-col gap-3 rounded-[14px] border border-[#333333] bg-[#1a1a1a] p-3.5">
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-bold leading-tight text-[#F0F0F0]">{club.name}</h3>
      <span className="w-fit rounded-full border border-[#FF6600] bg-[#FF6600]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF6600]">
        Pending review
      </span>
    </div>

    <div className="flex flex-col gap-1.5 rounded-xl border border-[#2A2A2A] bg-[#151515] px-3 py-2.5">
      <Row label="City" value={club.city} />
      <Row label="Admin name" value={club.adminName} />
      <Row label="Admin phone" value={club.adminPhone} />
      <Row label="WhatsApp" value={club.whatsappNumber} />
      <Row label="Submitted" value={club.createdAt ? format(new Date(club.createdAt), "MMM d, yyyy") : "—"} />
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={busy}
        className="flex-1 rounded-xl border border-[#16A34A] py-2.5 text-xs font-bold text-[#16A34A] transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={busy}
        className="flex-1 rounded-xl border border-[#DC2626] py-2.5 text-xs font-bold text-[#DC2626] transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  </div>
);

export default PendingClubRow;
