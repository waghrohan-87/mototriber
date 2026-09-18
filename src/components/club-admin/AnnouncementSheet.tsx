import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 500;

interface AnnouncementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (text: string) => void;
  posting?: boolean;
}

const AnnouncementSheet = ({ open, onOpenChange, onSend, posting = false }: AnnouncementSheetProps) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;
    onSend(trimmed);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-6 pt-2">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-[#F0F0F0]">Post announcement</h2>
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

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Share an update with all club members..."
            rows={5}
            maxLength={MAX_LENGTH}
            className="resize-none border-[#333333] bg-[#222222] text-sm text-[#F0F0F0] placeholder:text-[#666666] focus-visible:ring-[#FF6600]"
          />
          <span className="pt-1 text-right text-[11px] text-[#666666]">
            {text.length}/{MAX_LENGTH}
          </span>

          <button
            type="button"
            disabled={!text.trim() || posting}
            onClick={handleSend}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AnnouncementSheet;
