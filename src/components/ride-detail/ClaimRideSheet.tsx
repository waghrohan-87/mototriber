import { ExternalLink, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";

interface ClaimRideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: number;
  rideTitle: string;
  sourceUrl: string;
}

const ClaimRideSheet = ({ open, onOpenChange, rideId, rideTitle, sourceUrl }: ClaimRideSheetProps) => {
  const rideLink = `mototriber.com/ride/${rideId}`;
  const draftMessage = `Hey! Saw your post about the ${rideTitle} ride. I've created a ride for it on MotoTriber so we can coordinate — timing, meeting point, who's in. Join here: ${rideLink}. Would be great to ride together!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage);
      toast({ title: "Copied ✓" });
    } catch {
      toast({ title: "Couldn't copy message", description: "Please copy it manually.", variant: "destructive" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex items-start justify-between gap-3 pb-4">
            <h2 className="text-base font-bold leading-snug text-[#F0F0F0]">You're now coordinating this ride</h2>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#AAAAAA] transition-colors active:bg-[#222222]"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] py-3 text-sm font-semibold text-[#F0F0F0] transition-colors active:border-[#FF6600]/50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open the original post
            </a>
          )}

          <div className="mt-4 rounded-xl bg-[#222222] p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#DDDDDD]">{draftMessage}</p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            Copy message
          </button>

          <p className="mt-3 text-center text-xs text-[#888888]">
            Copy this, open the post, and paste it to let them know.
          </p>

          <DrawerClose asChild>
            <button
              type="button"
              className="mt-5 w-full rounded-xl border border-[#555555] py-3 text-sm font-bold text-[#F0F0F0] transition-transform active:scale-[0.98]"
            >
              Done
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ClaimRideSheet;
