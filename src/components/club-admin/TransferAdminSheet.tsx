import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import ConfirmDialog from "./ConfirmDialog";
import { getInitials } from "@/components/discover/RideCard";
import { Rider } from "@/components/riders/RiderCard";

const TINT_STYLES: Record<string, string> = {
  orange: "bg-[#4D2610]",
  blue: "bg-[#153552]",
  green: "bg-[#173A26]",
  purple: "bg-[#332059]",
  teal: "bg-[#0F3D3D]",
};

interface TransferAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Rider[];
  onTransfer: (rider: Rider) => void;
}

const TransferAdminSheet = ({ open, onOpenChange, members, onTransfer }: TransferAdminSheetProps) => {
  const [selected, setSelected] = useState<Rider | null>(null);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
          <div className="mx-auto flex max-h-[75vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-base font-bold text-[#F0F0F0]">Transfer admin rights</h2>
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#AAAAAA] transition-colors active:bg-[#222222]"
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>

            {members.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#888888]">No other members to transfer to.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelected(member)}
                    className="flex items-center gap-3 rounded-xl border border-[#333333] bg-[#151515] px-3.5 py-3 text-left transition-colors active:border-[#FF6600]/50"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                        TINT_STYLES[member.avatarTint]
                      )}
                    >
                      {getInitials(member.name)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-[#F0F0F0]">{member.name}</span>
                      <span className="truncate text-xs text-[#888888]">{member.handle}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={Boolean(selected)}
        onOpenChange={(next) => !next && setSelected(null)}
        title={`Make ${selected?.name} admin?`}
        description="You will lose admin access to this club. This can't be undone by yourself."
        confirmLabel="Transfer"
        onConfirm={() => {
          if (selected) onTransfer(selected);
          setSelected(null);
        }}
      />
    </>
  );
};

export default TransferAdminSheet;
