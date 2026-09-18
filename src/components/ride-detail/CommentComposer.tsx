import { KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface CommentComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}

const CommentComposer = ({ value, onChange, onSend, sending }: CommentComposerProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-5 flex items-center gap-2 border-t border-[#2A2A2A] bg-[#111111] px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a comment..."
        className="h-10 flex-1 rounded-full border border-[#333333] bg-[#222222] px-4 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none focus:border-[#FF6600]"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={sending || !value.trim()}
        aria-label="Send comment"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6600] text-white transition-transform active:scale-95 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CommentComposer;
