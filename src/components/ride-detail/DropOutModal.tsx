import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QUICK_REASONS = ["Plans changed", "Can't make the timing", "Bike issue", "Other"] as const;

interface DropOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const DropOutModal = ({ open, onOpenChange, onConfirm }: DropOutModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [touched, setTouched] = useState(false);

  const reason = selectedReason === "Other" ? otherText.trim() : selectedReason ?? "";
  const isValid = reason.length > 0;

  const reset = () => {
    setSelectedReason(null);
    setOtherText("");
    setTouched(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(reason);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 text-[#F0F0F0]">
        <h2 className="text-base font-bold text-[#F0F0F0]">Dropping out?</h2>
        <p className="text-xs text-[#888888]">Let the organiser know why you're dropping out.</p>

        <div className="flex flex-col gap-2 pt-1">
          {QUICK_REASONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedReason(option)}
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                selectedReason === option
                  ? "border-[#FF6600] bg-[#FF6600]/15 text-[#FF6600]"
                  : "border-[#333333] bg-[#222222] text-[#AAAAAA]"
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {selectedReason === "Other" && (
          <input
            autoFocus
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Tell us why..."
            className="w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]"
          />
        )}

        {touched && !isValid && (
          <p className="-mt-1 text-xs text-[#F87171]">Please select or enter a reason.</p>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full rounded-xl bg-[#DC2626] py-3 text-sm font-bold text-white transition-transform active:scale-[0.98] active:bg-[#DC2626]/90"
          >
            Confirm drop out
          </button>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-full rounded-xl border border-[#555555] py-3 text-sm font-bold text-[#AAAAAA] transition-transform active:scale-[0.98]"
          >
            Stay on ride
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DropOutModal;
