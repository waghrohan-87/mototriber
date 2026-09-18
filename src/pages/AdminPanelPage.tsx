import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PendingClubRow from "@/components/club-admin/PendingClubRow";

interface PendingClub {
  id: number;
  name: string;
  city: string;
  whatsappNumber: string;
  createdAt: string;
  adminName: string;
  adminPhone: string;
  adminUserId: number | null;
}

const AdminPanelPage = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<PendingClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage("clubs", {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "ID",
        IsAsc: false,
        Filters: [{ name: "status", op: "Equal", value: "pending" }],
      });
      if (error) throw new Error(error);
      const rows = (data?.List ?? []) as Record<string, unknown>[];

      const withAdmins = await Promise.all(
        rows.map(async (row) => {
          const clubId = Number(row.ID ?? row.id);
          let adminName = "";
          let adminPhone = "";
          const { data: cData } = await window.ezsite.apis.tablePage("club_admin_contacts", {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: "club_id", op: "Equal", value: clubId }],
          });
          const contact = cData?.List?.[0] as Record<string, unknown> | undefined;
          adminName = String(contact?.admin_full_name ?? "");
          adminPhone = String(contact?.admin_phone ?? "");
          return {
            id: clubId,
            name: String(row.name ?? ""),
            city: String(row.city ?? ""),
            whatsappNumber: String(row.whatsapp_number ?? ""),
            createdAt: String(row.created_at ?? ""),
            adminName,
            adminPhone,
            adminUserId: row.admin_user_id ? Number(row.admin_user_id) : null,
          };
        })
      );
      setClubs(withAdmins);
    } catch (err) {
      toast({
        title: "Couldn't load applications",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDecision = async (
    clubId: number,
    clubName: string,
    adminUserId: number | null,
    status: "approved" | "rejected"
  ) => {
    setBusyId(clubId);
    try {
      const { error } = await window.ezsite.apis.tableUpdate("clubs", {
        ID: clubId,
        status,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      setClubs((prev) => prev.filter((c) => c.id !== clubId));
      toast({
        title: status === "approved" ? "Application approved" : "Application rejected",
        description: `${clubName} ${status === "approved" ? "is now live in the directory." : "was rejected."}`,
      });

      if (adminUserId) {
        try {
          await window.ezsite.apis.tableCreate("notifications", {
            user_id: adminUserId,
            type: status === "approved" ? "club_approved" : "club_rejected",
            message:
              status === "approved"
                ? `Your club '${clubName}' has been approved! Tap to manage it.`
                : `Your club '${clubName}' application was not approved.`,
            related_club_id: clubId,
            is_read: "no",
            created_at: new Date().toISOString(),
          });
        } catch {
          // Notification is best-effort; the approval/rejection itself already succeeded.
        }
      }
    } catch (err) {
      toast({
        title: "Couldn't update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      className="flex h-screen flex-col bg-[#111111] text-[#F0F0F0]"
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#333333] px-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-bold">Admin panel</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] px-5 py-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6600] bg-[#FF6600]/10 px-3 py-1 text-xs font-bold text-[#FF6600]">
              {clubs.length} {clubs.length === 1 ? "club" : "clubs"} awaiting review
            </span>
          </div>

          <div className="flex items-start gap-2 border-b border-[#2A2A2A] px-5 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#888888]" />
            <p className="text-[11px] leading-relaxed text-[#666666]">
              Internal tool for reviewing club applications. Not linked from the main navigation.
            </p>
          </div>

          <div className="flex flex-col gap-3 px-5 py-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#F0F0F0]">
              Pending club applications
              {clubs.length > 0 && <span className="ml-2 text-xs font-semibold text-[#888888]">{clubs.length}</span>}
            </h2>

            {loading ? (
              <p className="py-6 text-center text-sm text-[#888888]">Loading applications...</p>
            ) : clubs.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#888888]">No pending applications right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {clubs.map((club) => (
                  <PendingClubRow
                    key={club.id}
                    club={club}
                    busy={busyId === club.id}
                    onApprove={() => handleDecision(club.id, club.name, club.adminUserId, "approved")}
                    onReject={() => handleDecision(club.id, club.name, club.adminUserId, "rejected")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanelPage;
