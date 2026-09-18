import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 10;

interface RideReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "edit" | "cancel";
  onSubmit: (reason: string) => void;
}

const COPY = {
  edit: {
    heading: "What are you changing?",
    placeholder: "Describe what you're changing and why...",
    submitLabel: "Submit and edit",
    submitClass: "bg-[#FF6600] active:bg-[#FF6600]/90",
  },
  cancel: {
    heading: "Why are you cancelling?",
    placeholder: "Let your riders know why...",
    submitLabel: "Submit and cancel",
    submitClass: "bg-[#DC2626] active:bg-[#DC2626]/90",
  },
} as const;

const RideReasonModal = ({ open, onOpenChange, mode, onSubmit }: RideReasonModalProps) => {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const copy = COPY[mode];
  const isValid = reason.trim().length >= MIN_LENGTH;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    onSubmit(reason.trim());
    setReason("");
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 text-[#F0F0F0]">
        <h2 className="text-base font-bold text-[#F0F0F0]">{copy.heading}</h2>

        <Textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={copy.placeholder}
          rows={4}
          className="min-h-[100px] resize-none rounded-xl border-[#333333] bg-[#222222] text-sm text-[#F0F0F0] placeholder:text-[#666666] focus-visible:ring-[#FF6600]"
        />
        {touched && !isValid && (
          <p className="-mt-2 text-xs text-[#F87171]">Please enter at least {MIN_LENGTH} characters.</p>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]",
              copy.submitClass
            )}
          >
            {copy.submitLabel}
          </button>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-full rounded-xl border border-[#555555] py-3 text-sm font-bold text-[#AAAAAA] transition-transform active:scale-[0.98]"
          >
            Go back
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideReasonModal;
